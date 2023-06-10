FROM codercom/enterprise-base:ubuntu

USER root

RUN apt update

ENV LC_ALL="en_US.UTF-8"
RUN locale-gen --purge "en_US.UTF-8"
RUN update-locale "LANG=en_US.UTF-8"
RUN dpkg-reconfigure --frontend noninteractive locales

RUN apt install zsh jq tmux screen ripgrep fd-find -y

RUN apt install gnupg gnupg2 gnupg1 -y
RUN sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
RUN wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
RUN apt update
RUN apt install postgresql-14 -y
COPY pg_hba.conf /etc/postgresql/14/main/pg_hba.conf
RUN chown postgres:postgres /etc/postgresql/14/main/pg_hba.conf
RUN chmod 640 /etc/postgresql/14/main/pg_hba.conf

RUN wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
RUN sh -c 'echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list'
RUN apt update
RUN apt install terraform -y

USER coder

RUN sh -c 'curl -fsSL https://code-server.dev/install.sh | sh'

RUN mkdir -p /tmp/awscli
COPY aws-public-key.gpg /tmp/awscli/key.gpg
RUN gpg --import /tmp/awscli/key.gpg
RUN sh -c 'curl -o "/tmp/awscli/awscliv2.sig" https://awscli.amazonaws.com/awscli-exe-linux-$(uname -m).zip.sig'
RUN sh -c 'curl -o "/tmp/awscli/awscliv2.zip" "https://awscli.amazonaws.com/awscli-exe-linux-$(uname -m).zip"'
RUN gpg --verify /tmp/awscli/awscliv2.sig /tmp/awscli/awscliv2.zip
RUN unzip -u -d /tmp/awscli/ /tmp/awscli/awscliv2.zip
RUN sudo /tmp/awscli/aws/install
RUN aws --version
RUN rm -rf /tmp/awscli

RUN python3 -m pip install localstack
