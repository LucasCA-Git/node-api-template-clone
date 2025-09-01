import subprocess

# Lista de comandos para instalar tudo necessário
commands = [
    # Atualizar pacotes
    "sudo apt update -y",

    # Instalar pacotes essenciais
    "sudo apt install -y docker.io docker-compose ansible conntrack kubectl "
    "qemu-kvm libvirt-daemon-system libvirt-clients virt-manager bridge-utils "
    "curl wget apt-transport-https ca-certificates software-properties-common",

    # Instalar Minikube
    "curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64",
    "sudo install minikube-linux-amd64 /usr/local/bin/minikube",
    "rm minikube-linux-amd64",

    # Adicionar usuário ao grupo docker
    f"sudo usermod -aG docker $USER"
]

for cmd in commands:
    print(f"\nExecutando: {cmd}\n{'='*40}")
    result = subprocess.run(cmd, shell=True)
    if result.returncode != 0:
        print(f"Erro ao executar: {cmd}")
        break
    else:
        print(f"Sucesso: {cmd}")