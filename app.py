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

    # Load ports from .env file dynamically
    ports = {"PORT_FRONTEND": "5173", "PORT_BACKEND": "8005"}
    env_path = os.path.join(root_dir, ".env")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    key = key.strip()
                    if key in ports:
                        ports[key] = value.strip()

    # Service commands using dynamic ports
    backend_cmd = f"python -m uvicorn app.main:app --reload --port {ports['PORT_BACKEND']}"
    frontend_cmd = f"npm run dev -- --port {ports['PORT_FRONTEND']}"

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
        print(f" - Backend: http://127.0.0.1:{ports['PORT_BACKEND']}")
        print(f" - Frontend: http://localhost:{ports['PORT_FRONTEND']}")
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
