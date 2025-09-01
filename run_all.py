import subprocess

commands = [
    "minikube delete --all",
    "docker system prune -a --volumes -f",
    "docker build -t lucascalecrim/node-api:lts .",
    "docker push lucascalecrim/node-api:lts",
    "ansible-playbook -i ansible/hosts.ini ansible/build-and-push.yml",
    "minikube start --driver=kvm2",
    "kubectl create configmap node-api-env --from-file=.env --dry-run=client -o yaml | kubectl apply -f -",
    "kubectl apply -f k8s/",
    "minikube status",
    "watch -n 1 kubectl get pods"
]

for cmd in commands:
    print(f"\nExecutando: {cmd}\n{'='*40}")
    result = subprocess.run(cmd, shell=True)
    if result.returncode != 0:
        print(f"Erro ao executar: {cmd}")
        break