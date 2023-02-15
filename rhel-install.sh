#!/usr/bin/env bash
# Currently built for rocky 9 / RHEL

# exit if anything fails
set -e

[ "$UID" -eq 0 ] || exec sudo -E bash "$0" "$@"
if [ ! -f "src/.env" ]; then
  cp src/.env.example src/.env
else
  cp src/.env src/.env.bk
fi
# Enable Code Ready Builder repo (required for EPEL)
dnf config-manager --set-enabled crb
dnf -y -q install epel-release

# install required apps
dnf -y -q install apg
dnf -y -q install git
dnf -y -q install nodejs
dnf -y -q install redis

# If I don't, I'll go insane
dnf -y -q install vim

cp /etc/redis/redis.conf /etc/redis/redis.conf.bk
redisPass=$(apg -n 1 -m 10 -x 12)
sed -i "s/REDIS_PASS.*$/REDIS_PASS=\"$redisPass\"/g" src/.env
sed -i "s/# requirepass foobared/requirepass $redisPass/g" /etc/redis/redis.conf
systemctl start redis
systemctl enable redis

echo "node version: $(node -v)"
echo "npm version: $(npm -v)"

dnf -y install mariadb-server
systemctl start mariadb
systemctl enable mariadb

sqlPass=$(apg -n 1 -m 10 -x 12)
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

# install packages with NPM, run knex db migrations and knex db seeding
npm install
npm run db:migrate
npm run db:seed
