FROM ubuntu:18.04

RUN apt-get update
 
RUN apt install sudo wget curl gnupg gnupg1 gnupg2 -y
RUN apt install software-properties-common systemd vim -y
RUN wget -qO- https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
 
RUN add-apt-repository "$(wget -qO- https://packages.microsoft.com/config/ubuntu/18.04/mssql-server-2019.list)"
RUN apt-get update
RUN apt-get install -y mssql-server

RUN /opt/mssql/bin/mssql-conf set hadr.hadrenabled  1
RUN /opt/mssql/bin/mssql-conf set sqlagent.enabled true

RUN curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
RUN curl https://packages.microsoft.com/config/ubuntu/18.04/prod.list | sudo tee /etc/apt/sources.list.d/msprod.list
RUN apt-get update 
RUN yes | apt-get install mssql-tools unixodbc-dev
#RUN apt-get install openssh-client -y
 
EXPOSE 1433
