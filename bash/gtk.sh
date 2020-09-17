#!/usr/bin/env bash

# bash strict settings
set -o errexit # exit on errors
set -o nounset # exit on use of uninitialized variable
set -o pipefail

import colors
import echoerr

source ./actions/inc.sh

(( $# != 0 )) || echoerrandexit "No command given. Try:\n${bold}${green}gtk help${reset}"

ACTION_GROUP="${1}"; shift

# TODO: check if there are other parameters

case "$ACTION_GROUP" in
  hotfixes)
    gtk-$ACTION_GROUP "$@";;
  *)
    echoerrandexit "Unkown group or global command. Try:\n${bold}${green}gtk help${reset}";;
esac
