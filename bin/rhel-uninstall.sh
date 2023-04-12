#!/usr/bin/env bash
# Currently built for rocky 9
# exit if anything fails
#set -e

[ "$UID" -eq 0 ] || exec sudo -E bash "$0" "$@"

delete=0

SHORT=f,h
LONG=delete-dbs,help
OPTS=$(getopt -a -n rhel-uninstall --options $SHORT --longoptions $LONG -- "$@")

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

if [ -f "src/.env" ]; then
  mv src/.env src/.env.cleanup.bk
fi

# stop DB services and uninstall required apps
systemctl stop redis
systemctl disable redis
systemctl stop mariadb
systemctl disable mariadb
dnf -y remove git
dnf -y module remove nodejs redis mariadb-server

systemctl stop ndm.target
systemctl disable ndm.target
systemctl disable ndm-ui.service
systemctl disable ndm-IngestionProcessor.service

userdel ndm

if [ $delete -eq 1 ]; then
  rm -rf /var/lib/mysql
  rm -f /etc/redis/redis.conf
fi
