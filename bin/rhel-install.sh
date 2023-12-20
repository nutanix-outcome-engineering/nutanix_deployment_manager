#!/usr/bin/env bash
# Currently built for rocky 9 / RHEL 8

# exit if anything fails
randstr() { < /dev/urandom tr -dc '@%#$_A-Za-z0-9' | head -c 12; echo; }
set -e

[ "$UID" -eq 0 ] || exec sudo -E bash "$0" "$@"
if [ ! -f "src/.env" ]; then
  cp src/.env.example src/.env
else
  cp src/.env src/.env.bk
fi

# install required apps
dnf -y  install git
dnf -y  module install nodejs:16/common
dnf -y  module install redis:6/common

# If I don't, I'll go insane
dnf -y  install vim

test -f /etc/redis.conf && redisConfFile=/etc/redis.conf
test -f /etc/redis/redis.conf && redisConfFile=/etc/redis/redis.conf
cp $redisConfFile $redisConfFile.bk
redisPass=$(randstr)
sed -i "s/REDIS_PASS.*$/REDIS_PASS=\"$redisPass\"/g" src/.env
sed -i "s/# requirepass foobared/requirepass $redisPass/g" $redisConfFile
systemctl start redis
systemctl enable redis

echo "node version: $(node -v)"
echo "npm version: $(npm -v)"

## Uncomment this if we need to use the MariaDB provided repo
# cat <<EOF > /etc/yum.repos.d/MariaDB.repo
# # MariaDB 10.6 RedHatEnterpriseLinux repository list - created 2023-03-28 18:53 UTC
# # https://mariadb.org/download/
# [mariadb]
# name = MariaDB
# # rpm.mariadb.org is a dynamic mirror if your preferred mirror goes offline. See https://mariadb.org/mirrorbits/ for details.
# baseurl = https://rpm.mariadb.org/10.6/rhel/$releasever/$basearch
# # baseurl = https://mirror.its.dal.ca/mariadb/yum/10.6/rhel/$releasever/$basearch
# module_hotfixes = 1
# gpgkey = https://rpm.mariadb.org/RPM-GPG-KEY-MariaDB
# # gpgkey = https://mirror.its.dal.ca/mariadb/yum/RPM-GPG-KEY-MariaDB
# gpgcheck = 1
# EOF
dnf -y  module install mariadb:10.5/server
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

serverName=$(hostname -f)
sed -i "s/\(RX_SERVER_NAME=\).*/\1\"$serverName\"/g" src/.env
sed -i "s%\(RX_SERVER_CERT=\).*%\1\"src/ui/${serverName//./_}.pem\"%g" src/.env
sed -i "s%\(RX_SERVER_KEY=\).*%\1\"src/ui/key.pem\"%g" src/.env
openssl req -x509 -newkey rsa:4096 -nodes -keyout src/ui/key.pem -out src/ui/${serverName//./_}.pem -sha256 -days 365 -subj "/C=US/ST=North Carolina/L=Durham/O=Random/OU=Org/CN=$serverName"

# install packages with NPM, run knex db migrations and knex db seeding
npm install
npm run db:migrate
npm run db:seed

# Create user
groupadd --system ndm
useradd --no-create-home --system --home /opt/nutanix/ndm --shell /sbin/nologin --comment "Nutanix Deployment Manager(NDM)" --gid ndm ndm
usermod --gid ndm ndm
cp bin/systemd/* /etc/systemd/system
mkdir -p /opt/nutanix/ndm
cp -r . /opt/nutanix/ndm
chown -R ndm:ndm /opt/nutanix/ndm
chmod -R og-rw /opt/nutanix/ndm

# Enable Systemd targets and services
systemctl daemon-reload
systemctl enable ndm.target
systemctl enable ndm-ui.service
systemctl enable ndm-IngestionProcessor.service
systemctl enable ndm-taskProcessor.service
systemctl start ndm.target
