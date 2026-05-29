import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios";
import DashboardShell from "../components/DashboardShell";

const socketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== "undefined" && window.location?.origin
    ? window.location.origin
    : undefined);
const rtcConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

function VideoCall() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [session, setSession] = useState(null);
  const [status, setStatus] = useState("Preparing your consultation room...");
  const [error, setError] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [debugState, setDebugState] = useState({
    session: "loading",
    socket: "connecting",
    localMedia: "waiting",
    peerRoom: "waiting",
    signaling: "idle",
    remoteStream: "waiting"
  });

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const createOffer = async () => {
      if (!peerRef.current || !socketRef.current) {
        return;
      }

      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);
      socketRef.current.emit("offer", { sessionId, offer });
    };

  const setupCall = async () => {
      try {
        setError("");
        setDebugState((current) => ({
          ...current,
          session: "loading",
          socket: "connecting",
          localMedia: "requesting"
        }));
        const sessionRes = await API.get(`/sessions/${sessionId}`);

        if (!mounted) {
          return;
        }

        setSession(sessionRes.data.data);
        setDebugState((current) => ({
          ...current,
          session: "loaded"
        }));

        const mediaDevicesApi =
          typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;

        if (!window.isSecureContext) {
          setDebugState((current) => ({
            ...current,
            localMedia: "secure-context-required"
          }));
          throw new Error(
            "Camera and microphone need a secure page on mobile. Open this call over HTTPS or use localhost on the same device."
          );
        }

        if (!mediaDevicesApi?.getUserMedia) {
          setDebugState((current) => ({
            ...current,
            localMedia: "unsupported"
          }));
          throw new Error(
            "This browser cannot access camera or microphone here. Try Chrome/Safari on a secure HTTPS page."
          );
        }

        const stream = await mediaDevicesApi.getUserMedia({
          video: true,
          audio: true
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = stream;
        setDebugState((current) => ({
          ...current,
          localMedia: "ready"
        }));

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const peerConnection = new RTCPeerConnection(rtcConfig);
        peerRef.current = peerConnection;

        stream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, stream);
        });

        peerConnection.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
          setDebugState((current) => ({
            ...current,
            remoteStream: "connected"
          }));
          setStatus("Live consultation connected.");
        };

        peerConnection.onicecandidate = (event) => {
          if (event.candidate && socketRef.current) {
            socketRef.current.emit("ice-candidate", {
              sessionId,
              candidate: event.candidate
            });
          }
        };

        const token = localStorage.getItem("token");
        const socket = io(socketUrl, {
          path: "/socket.io",
          auth: { token }
        });
        socketRef.current = socket;

        socket.on("connect", () => {
          setDebugState((current) => ({
            ...current,
            socket: "connected"
          }));
        });

        socket.on("connect_error", (connectError) => {
          setDebugState((current) => ({
            ...current,
            socket: "failed"
          }));
          setError(connectError.message || "Unable to connect to the live call.");
        });

        socket.on("user-joined", async ({ role }) => {
          if (
            ["psychologist", "clinicalpsychologist"].includes(user?.role) &&
            role === "patient"
          ) {
            setDebugState((current) => ({
              ...current,
              peerRoom: "peer-joined",
              signaling: "creating-offer"
            }));
            setStatus("Patient joined. Connecting the call...");
            await createOffer();
          }
        });

        socket.on("offer", async ({ offer }) => {
          setDebugState((current) => ({
            ...current,
            signaling: "received-offer",
            peerRoom: "peer-joined"
          }));
          setStatus("Incoming consultation request...");
          await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          socket.emit("answer", { sessionId, answer });
          setDebugState((current) => ({
            ...current,
            signaling: "sent-answer"
          }));
          setStatus("Connecting to clinician...");
        });

        socket.on("answer", async ({ answer }) => {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
          setDebugState((current) => ({
            ...current,
            signaling: "received-answer"
          }));
          setStatus("Finalizing live connection...");
        });

        socket.on("ice-candidate", async ({ candidate }) => {
          if (candidate) {
            try {
              await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
              setDebugState((current) => ({
                ...current,
                signaling: "ice-exchanged"
              }));
            } catch (candidateError) {
              console.log("ICE candidate error:", candidateError);
            }
          }
        });

        socket.on("peer-left", () => {
          setDebugState((current) => ({
            ...current,
            peerRoom: "peer-left",
            remoteStream: "waiting"
          }));
          setStatus("The other participant left the call.");
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
        });

        socket.on("call-state", ({ callStatus }) => {
          if (
            callStatus === "waiting" &&
            ["psychologist", "clinicalpsychologist"].includes(user?.role)
          ) {
            setStatus("Waiting for the patient to join...");
          }
          if (callStatus === "live") {
            setStatus("Live consultation in progress.");
          }
        });

        socket.emit("join-session", { sessionId }, async ({ ok, message, shouldCreateOffer }) => {
          if (!ok) {
            setDebugState((current) => ({
              ...current,
              peerRoom: "join-failed"
            }));
            setError(message || "Unable to join this session.");
            return;
          }

          setDebugState((current) => ({
            ...current,
            peerRoom: "joined-room"
          }));

          if (user?.role === "psychologist") {
            setStatus("Waiting for the patient to join...");
            if (shouldCreateOffer) {
              setDebugState((current) => ({
                ...current,
                peerRoom: "peer-joined",
                signaling: "creating-offer"
              }));
              await createOffer();
            }
          } else if (user?.role === "clinicalpsychologist") {
            setStatus("Waiting for the patient to join...");
            if (shouldCreateOffer) {
              setDebugState((current) => ({
                ...current,
                peerRoom: "peer-joined",
                signaling: "creating-offer"
              }));
              await createOffer();
            }
          } else {
            setStatus("Joining the live session...");
          }
        });
      } catch (setupError) {
        console.log(setupError);
        const mediaPermissionMessage =
          setupError.name === "NotAllowedError"
            ? "Camera or microphone permission was denied. Please allow access in the browser and reload the page."
            : null;

        setDebugState((current) => ({
          ...current,
          session: current.session === "loading" ? "failed" : current.session,
          localMedia:
            setupError.name === "NotAllowedError"
              ? "blocked"
              : current.localMedia === "requesting"
                ? "failed"
                : current.localMedia
        }));

        setError(
          mediaPermissionMessage ||
          setupError.response?.data?.message ||
            setupError.message ||
            "Unable to start the video consultation."
        );
      }
    };

    setupCall();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.emit("leave-session", { sessionId });
        socketRef.current.disconnect();
      }
      if (peerRef.current) {
        peerRef.current.close();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [sessionId, user?.role]);

  const handleToggleMute = () => {
    if (!localStreamRef.current) {
      return;
    }

    const nextMuted = !isMuted;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMuted(nextMuted);
  };

  const handleToggleCamera = () => {
    if (!localStreamRef.current) {
      return;
    }

    const nextCameraOff = !isCameraOff;
    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = !nextCameraOff;
    });
    setIsCameraOff(nextCameraOff);
  };

  const handleLeave = async () => {
    let destination = "/patient";

    try {
      if (["psychologist", "clinicalpsychologist"].includes(user?.role)) {
        await API.post(`/sessions/${sessionId}/end-call`);
      }
    } catch (leaveError) {
      console.log(leaveError);
    }

    const navigationState = {
      patient: session?.patient || null,
      sessionId
    };

    if (user?.role === "psychologist") {
      destination = "/psychologist";
    } else if (user?.role === "clinicalpsychologist") {
      destination = "/clinical";
    }

    navigate(destination, destination === "/patient" ? undefined : { state: navigationState });
  };

  const remoteConnected = debugState.remoteStream === "connected";
  const roomReady = debugState.peerRoom === "peer-joined";

  return (
    <DashboardShell
      title="Video Consultation"
      description={session ? `Session with ${session.patient?.name || "patient"}` : status}
      tag="Live Care"
      actions={
        <button className="ghost-button" onClick={handleLeave}>
          Leave Call
        </button>
      }
    >
      {error && <p className="status-note">{error}</p>}

      <section className="video-call-stage card">
        <div className="video-call-remote">
          <video ref={remoteVideoRef} className="video-call-video" autoPlay playsInline />

          {!remoteConnected && (
            <div className="video-call-placeholder" aria-live="polite">
              <p className="video-call-placeholder-title">
                {roomReady ? "Connecting video..." : "Waiting for the other participant..."}
              </p>
              <p className="video-call-placeholder-copy">{status}</p>
            </div>
          )}

          <div className="video-call-topbar">
            <div className="video-call-topbar-left">
              <p className="video-call-room-title">
                {session
                  ? `${session.psychologist?.name || "Clinician"} - ${session.patient?.name || "Patient"}`
                  : "Consultation room"}
              </p>
              <p className="video-call-room-subtitle">{status}</p>
            </div>

            <div className="video-call-topbar-right">
              <button
                type="button"
                className="video-call-chip"
                onClick={() => setShowDiagnostics((current) => !current)}
              >
                {showDiagnostics ? "Hide details" : "Show details"}
              </button>
            </div>
          </div>

          <div className="video-call-pip">
            <video
              ref={localVideoRef}
              className="video-call-video"
              autoPlay
              muted
              playsInline
            />
            {isCameraOff && <div className="video-call-pip-overlay">Camera off</div>}
            <div className="video-call-pip-label">You</div>
          </div>

          <div className="video-call-controls" role="group" aria-label="Call controls">
            <button
              type="button"
              className={isMuted ? "call-control danger" : "call-control"}
              onClick={handleToggleMute}
            >
              {isMuted ? "Unmute" : "Mute"}
            </button>
            <button
              type="button"
              className={isCameraOff ? "call-control danger" : "call-control"}
              onClick={handleToggleCamera}
            >
              {isCameraOff ? "Camera on" : "Camera off"}
            </button>
            <button type="button" className="call-control end" onClick={handleLeave}>
              End
            </button>
          </div>
        </div>

        {showDiagnostics && (
          <aside className="video-call-details">
            <div className="video-call-details-card">
              <h3 className="panel-title">Call details</h3>
              <p className="panel-copy">
                Use this to confirm that devices, signaling, and the remote stream are ready.
              </p>
              <div className="progress-grid" style={{ marginTop: "14px" }}>
                <div className="stat-card">
                  <span className="stat-label">Session</span>
                  <p className="stat-value">{debugState.session}</p>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Socket</span>
                  <p className="stat-value">{debugState.socket}</p>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Camera / Mic</span>
                  <p className="stat-value">{debugState.localMedia}</p>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Room</span>
                  <p className="stat-value">{debugState.peerRoom}</p>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Signaling</span>
                  <p className="stat-value">{debugState.signaling}</p>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Remote stream</span>
                  <p className="stat-value">{debugState.remoteStream}</p>
                </div>
              </div>
            </div>
          </aside>
        )}
      </section>
    </DashboardShell>
  );
}

export default VideoCall;
