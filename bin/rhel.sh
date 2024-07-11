#!/usr/bin/env bash

#exit if anything fails
set -e

INSTALLDIR=/opt/nutanix/ndm

randstr() { < /dev/urandom tr -dc '@%#$_A-Za-z0-9' | head -c 12; echo; }

[ "$UID" -eq 0 ] || exec sudo -E bash "$0" "$@"

install() {
  if [ ! -f "src/.env" ]; then
    cp src/.env.example src/.env
  else
    cp src/.env src/.env.bk
  fi

  serverName=$(hostname -f)
  cookie=$(randstr)
  sed -i "s/\(RX_SERVER_NAME=\).*/\1\"$serverName\"/g" src/.env
  sed -i "s%\(RX_SERVER_CERT=\).*%\1\"src/ui/${serverName//./_}.pem\"%g" src/.env
  sed -i "s%\(RX_SERVER_KEY=\).*%\1\"src/ui/key.pem\"%g" src/.env
  sed -i "s%\(NDM_SERVER_COOKIE=\).*%\1\"$cookie\"%g" src/.env
  openssl req -x509 -newkey rsa:4096 -nodes -keyout src/ui/key.pem -out src/ui/${serverName//./_}.pem -sha256 -days 3650 -subj "/C=US/ST=North Carolina/L=Durham/O=Random/OU=Org/CN=$serverName"

  sed -i "s%\(NDM_SSH_PRIVATE=\).*%\1\"src/ndm_ssh\"%g" src/.env
  sed -i "s%\(NDM_SSH_PUBLIC=\).*%\1\"src/ndm_ssh.pub\"%g" src/.env
  ssh-keygen -f src/ndm_ssh -N "" -t ed25519 -C 'NDM-SSHKEY'

  sed -i "s%\(RX_FILESTORE_BASE_DIRECTORY=\).*%\1\"/srv/ndm/\"%g" src/.env
  sed -i "s%\(NDM_FILESTORE_TUS_BASE=\).*%\1\"/srv/ndm/\"%g" src/.env
  sed -i "s%\(RX_FILESTORE_EXPORT_DIRECTORY=\).*%\1\"exports\"%g" src/.env

  # Create user
  groupadd --system ndm
  useradd --no-create-home --system --home /opt/nutanix/ndm --shell /sbin/nologin --comment "Nutanix Deployment Manager(NDM)" --gid ndm ndm
  usermod --gid ndm ndm

  installDependencies
  setupDependencies
  # Create install dir
  mkdir -p ${INSTALLDIR}

  #create exports directory
  mkdir -p /srv/ndm/exports

  setupSystemd
  setupNDM 1
  fixPermissions
  startNDM
}

installDependencies() {
  # install required apps
  dnf -y install git nfs-utils vim
  dnf -y module install nodejs:20/common
  dnf -y module install redis:7/common

  echo "node version: $(node -v)"
  echo "npm version: $(npm -v)"

  ## Uncomment this if we need to use the MariaDB provided repo
cat <<EOF > /etc/yum.repos.d/MariaDB.repo
# MariaDB 10.11 RedHatEnterpriseLinux repository list
# https://mariadb.org/download/
[mariadb]
name = MariaDB
baseurl = https://rpm.mariadb.org/10.11/rhel/\$releasever/\$basearch
module_hotfixes = 1
gpgkey = https://rpm.mariadb.org/RPM-GPG-KEY-MariaDB
# gpgkey = https://mirror.its.dal.ca/mariadb/yum/RPM-GPG-KEY-MariaDB
gpgcheck = 1
EOF

  dnf -y  install MariaDB-server MariaDB-client
}

setupDependencies() {
  test -f /etc/redis.conf && redisConfFile=/etc/redis.conf
  test -f /etc/redis/redis.conf && redisConfFile=/etc/redis/redis.conf
  cp $redisConfFile $redisConfFile.bk
  redisPass=$(randstr)
  sed -i "s/REDIS_PASS.*$/REDIS_PASS=\"$redisPass\"/g" src/.env
  sed -i "s/# requirepass foobared/requirepass $redisPass/g" $redisConfFile
  systemctl start redis
  systemctl enable redis

cat > /etc/exports <<EOF
/srv/ndm/exports *(rw,all_squash,anonuid=$(id -u ndm),anongid=$(id -g ndm))
EOF

  systemctl enable --now nfs-server rpcbind

  systemctl start mariadb
  systemctl enable mariadb

  sqlPass=$(randstr)
  sed -i "s/RX_MYSQL_PASSWORD.*$/RX_MYSQL_PASSWORD=\"$sqlPass\"/g" src/.env
  #TODO: ^ input this into my.cnf and secure my.cnf, swap user that sql uses away from root

mysql -su root <<EOS
UPDATE mysql.global_priv SET priv=json_set(priv, '$.plugin', 'mysql_native_password', '$.authentication_string', PASSWORD('$sqlPass')) WHERE User='root';
DELETE FROM mysql.user WHERE User='';
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';
FLUSH PRIVILEGES;
CREATE DATABASE ndm;
EOS
}

uninstall() {
  stopNDM
  systemctl disable ndm.target
  systemctl disable ndm-ui.service
  systemctl disable ndm-IngestionProcessor.service
  systemctl disable ndm-taskProcessor.service

  userdel ndm

  dnf -y  remove git nfs-utils vim
  dnf -y  module remove nodejs:20/common
  dnf -y  module remove redis:7/common
  dnf -y remove nfs-utils
  dnf -y  remove MariaDB-server MariaDB-client
}

update() {
  stopNDM
  setupNDM
  setupSystemd
  fixPermissions
  startNDM
}

fixPermissions() {
  chown -R ndm:ndm ${INSTALLDIR}
  chmod -R og-rw ${INSTALLDIR}
  chown -R ndm:ndm /srv/ndm
  chmod -R 777 /srv/ndm/exports
}

stopNDM() {
  systemctl stop ndm.target
}

startNDM() {
  systemctl start ndm.target
}

setupNDM() {
  local initialInstall=${1:-0}
  cp -r . ${INSTALLDIR}
  cd ${INSTALLDIR}
  npm install
  npm run db:migrate
  if [ $initialInstall -eq 1 ]; then
    npm run db:seed
  fi
}

setupSystemd() {
  cp bin/systemd/* /etc/systemd/system
  # Enable Systemd targets and services
  systemctl daemon-reload
  systemctl enable ndm.target
  systemctl enable ndm-ui.service
  systemctl enable ndm-IngestionProcessor.service
  systemctl enable ndm-taskProcessor.service
}



case $1 in
  install)
    install
  ;;
  setup)
    setupDependencies
    setupNDM 1
  ;;
  uninstall)
    shift
    delete=0
    OPTS=$(getopt -a -n rhel-uninstall --options "f,h" --longoptions "delete-dbs,help" -- "$@")
    eval set -- "$OPTS"
    while :
    do
      case "$1" in
        -f | --delete-dbs )
          delete=1
          shift;
          ;;
        -h | --help)
          echo "To uninstall packages, $0, to also uninstall databases use -f or --delete-dbs"
          exit 2
          ;;
        --)
          shift;
          break
          ;;
        *)
          echo "Unexpected option: $1"
          ;;
      esac
    done

    uninstall
    if [ -f "src/.env" ]; then
      mv src/.env src/.env.cleanup.bk
    fi
    if [ $delete -eq 1 ]; then
      rm -rf /var/lib/mysql
      rm -f /etc/redis/redis.conf
    fi
  ;;
  update)
    update
  ;;
  *)
    echo 'Help message.'
  ;;
esac
