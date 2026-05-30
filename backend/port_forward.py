import socket
import threading

def forward(source, destination):
    while True:
        try:
            data = source.recv(4096)
            if len(data) == 0:
                break
            destination.sendall(data)
        except Exception as e:
            break
    source.close()
    destination.close()

def start_server(listen_port, target_host, target_port):
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.bind(('0.0.0.0', listen_port))
    server.listen(5)
    print(f"[*] Listening on 0.0.0.0:{listen_port} and forwarding to {target_host}:{target_port}")

    while True:
        client_socket, addr = server.accept()
        
        target_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            target_socket.connect((target_host, target_port))
            
            client_thread = threading.Thread(target=forward, args=(client_socket, target_socket))
            target_thread = threading.Thread(target=forward, args=(target_socket, client_socket))
            
            client_thread.start()
            target_thread.start()
        except Exception as e:
            client_socket.close()

def main():
    # Forward MongoDB
    threading.Thread(target=start_server, args=(27018, '127.0.0.1', 27017), daemon=True).start()
    
    # Forward FastAPI Backend for Mobile App
    threading.Thread(target=start_server, args=(8080, '127.0.0.1', 8000), daemon=True).start()
    
    print("[*] Both port forwarders are running. Press Ctrl+C to stop.")
    try:
        while True:
            pass
    except KeyboardInterrupt:
        print("\n[*] Exiting.")

if __name__ == '__main__':
    main()
