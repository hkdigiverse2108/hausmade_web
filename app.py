import subprocess
import sys
import os
import time

def run_service(cmd, cwd, name):
    print(f"[{name}] Starting...")
    # Use shell=True to support windows-specific command executables like npm
    process = subprocess.Popen(
        cmd,
        shell=True,
        cwd=cwd,
        stdout=None,  # Inherit stdout so output is visible in the same terminal
        stderr=None   # Inherit stderr
    )
    return process

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")
    backend_dir = os.path.join(root_dir, "backend")

    # Service commands
    backend_cmd = "uvicorn app.main:app --reload --port 8005"
    frontend_cmd = "npm run dev"

    processes = []
    try:
        # 1. Start Backend
        backend_proc = run_service(backend_cmd, backend_dir, "BACKEND")
        processes.append(backend_proc)
        
        # Give backend a moment to start
        time.sleep(1)

        # 2. Start Frontend
        frontend_proc = run_service(frontend_cmd, frontend_dir, "FRONTEND")
        processes.append(frontend_proc)

        print("\n" + "="*50)
        print(" BOTH SERVICES RUNNING CONCURRENTLY!")
        print(" - Backend: http://127.0.0.1:8005")
        print(" - Frontend: http://localhost:5173 (typically)")
        print(" Press Ctrl+C to terminate both servers.")
        print("="*50 + "\n")

        # Keep parent process alive while children run
        while True:
            # Check if any process died
            for p in processes:
                if p.poll() is not None:
                    print(f"\n[SYSTEM] One of the processes terminated with exit code: {p.poll()}")
                    raise KeyboardInterrupt
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n[SYSTEM] Shutting down both services...")
        for p in processes:
            if p.poll() is None:  # If still running
                try:
                    # On Windows, taskkill or terminating subprocesses spawned via shell=True
                    # requires sending a signal or killing the process tree
                    if os.name == 'nt':
                        subprocess.run(f"taskkill /F /T /PID {p.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    else:
                        p.terminate()
                except Exception as e:
                    print(f"Error terminating process: {e}")
        print("[SYSTEM] All services stopped.")
        sys.exit(0)

if __name__ == "__main__":
    main()
