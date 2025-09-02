# **Resolução de Problemas no Projeto DevOps**

Este documento registra as principais problemáticas de DevOps que surgiram durante o desenvolvimento deste projeto e as soluções aplicadas. Ele serve como um histórico para consultas futuras e destaca a colaboração no processo de resolução.

## **1\. Problema: Conectividade e Orquestração de Micro-serviços**

**Cenário:** A aplicação Node.js e o banco de dados PostgreSQL precisavam se comunicar de forma confiável em um ambiente de contêiner. Sem uma orquestração adequada, seria difícil gerenciar a comunicação e garantir que o banco de dados estivesse pronto antes da aplicação.

**Solução:** Implementação de manifestos do Kubernetes (`.yml`) para gerenciar o ciclo de vida e a comunicação entre os serviços.

* **app-deployment.yml** e **db-deployment.yml**: Definiram como os contêineres da API e do banco de dados seriam executados, garantindo que o Kubernetes gerenciasse a saúde e o estado de cada um.  
* **app-service.yml** e **db-service.yml**: Criaram serviços de rede para cada contêiner, fornecendo um nome de host estável (`postgres-service`) para a API se conectar ao banco de dados, independentemente do IP do Pod.

**Destaque da Colaboração:** Você identificou a necessidade de mapear as variáveis de ambiente na aplicação (`PG_HOST`, `PG_USER`, etc.) para os serviços do Kubernetes, garantindo que a API pudesse encontrar o banco de dados pelo seu nome de serviço interno.

## **2\. Problema: Persistência de Dados**

**Cenário:** Os dados do PostgreSQL precisavam ser persistentes, pois um simples reinício do Pod resultaria na perda total dos dados.

**Solução:** Uso de volumes persistentes.

* **PersistentVolumeClaim (`db-deployment.yml`)**: A solução para a persistência foi a inclusão de um `PersistentVolumeClaim` (PVC) no manifesto do `db-deployment`. Isso garante que os dados do banco sejam armazenados em um volume persistente do cluster, separado do ciclo de vida do Pod.

## **3\. Problema: Erro no Pod de Inicialização e Falhas de Conectividade por IP**

**Cenário:** O Pod de inicialização do banco de dados entrava em estado de erro. Através da **leitura dos logs**, foi possível identificar que o Pod tentava se conectar ao PostgreSQL antes que o serviço estivesse completamente pronto. Além disso, a dependência em endereços de IP era frágil e propensa a falhas.

**Solução:** Implementação de uma checagem de prontidão e uso de nomes de serviço.

* **Comando de Prontidão**: A chave para resolver o erro do Pod foi a adição do comando `pg_isready` no `init-db.yml`. Este comando faz com que o Pod espere e só prossiga com a criação da tabela quando o banco de dados estiver de fato pronto para aceitar conexões. Isso eliminou a "race condition".  
* **Nomes de Serviço**: Para resolver o problema de IPs instáveis, foi reforçada a utilização de **Services** no Kubernetes. Em vez de usar IPs, a aplicação se conecta ao banco de dados usando o nome de serviço estável (`postgres-service`), que o Kubernetes resolve para o IP correto do Pod do banco de dados.

**Destaque da Colaboração:** Sua insistência em investigar a causa do Pod em erro, combinada com a observação dos logs e a leitura dos IPs, foi crucial para diagnosticar e resolver a "race condition" e o problema de conectividade.

## **4\. Problema: Automatização e Repetibilidade do Deployment**

**Cenário:** O processo de build, push e deployment era manual, propenso a erros e ineficiente, especialmente em um fluxo de trabalho de CI/CD (Integração e Entrega Contínuas).

**Solução:** Implementação do Ansible para automatizar todo o fluxo.

* **Playbooks (`provisionamento.yml`)**: O Ansible foi utilizado para criar playbooks que aplicam os manifestos do Kubernetes na ordem correta, garantindo que a infraestrutura seja provisionada de forma consistente.  
* **Scripts de automação em Python (`install_all.py`, `run_all.py`)**: Para simplificar ainda mais a experiência do desenvolvedor, você sugeriu a criação de scripts Python para automatizar a instalação de todas as dependências (Docker, Minikube, kubectl, Ansible) e para orquestrar o fluxo completo de build, push e deployment com um único comando.

**Destaque da Colaboração:** A sua sugestão de criar os scripts Python foi um avanço significativo, transformando um processo complexo de múltiplas etapas manuais em um fluxo de trabalho simples, rápido e automatizado.

#### **1\. Conectividade e Orquestração: `app-deployment.yml` e `app-service.yml`**

* **Problema**: Como a API Node.js encontra o banco de dados PostgreSQL dentro do cluster?  
* **Solução em Código**: A chave está nas variáveis de ambiente do `app-deployment.yml` e na definição do `app-service.yml`.  
  * No `app-deployment`, a linha **`value: "postgres-service"`** para a variável **`PG_HOST`** garante que a sua aplicação se conecte ao banco de dados usando um nome de serviço estável, e não um IP dinâmico.  
  * O **`app-service.yml`** cria esse nome de serviço (`node-api-service`) e mapeia as portas, permitindo que o tráfego de rede chegue até o Pod da sua API.

#### **2\. Persistência de Dados: `db-deployment.yml`**

* **Problema**: Como garantir que os dados do banco de dados não sejam perdidos se o Pod for reiniciado ou recriado?  
* **Solução em Código**: A seção `volumeMounts` e a `PersistentVolumeClaim` (PVC) no `db-deployment.yml` são as chaves.  
  * A linha **`claimName: postgres-pv-claim`** no `db-deployment` solicita um volume persistente do Kubernetes. Isso garante que o diretório de dados do PostgreSQL (`/var/lib/postgresql/data`) seja salvo em um local permanente, independente do Pod.

#### **3\. Erro de Inicialização e "Race Condition": `init-db.yml`**

* **Problema**: Como garantir que a tabela do banco de dados seja criada apenas depois que o banco estiver completamente pronto para aceitar conexões?  
* **Solução em Código**: O comando `until` dentro do `init-db.yml` resolve este problema.  
  * A linha **`until pg_isready...`** cria um loop que faz com que o Pod espere e só avance para a próxima linha (`psql -c "CREATE TABLE..."`) quando o serviço do PostgreSQL estiver acessível. Isso elimina a "race condition", um erro comum onde um serviço tenta se conectar a outro antes que ele esteja disponível.

#### **4\. Automação e Repetibilidade: Ansible**

* **Problema**: O processo de build, push e deployment era manual, propenso a erros e ineficiente.  
* **Solução em Código**: Embora não seja um manifesto do Kubernetes, a automação com Ansible é a solução. O `provisionamento.yml` garante que todos os arquivos `.yml` sejam aplicados na ordem correta, transformando um processo manual em um fluxo automatizado.

