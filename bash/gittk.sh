#!/usr/bin/env bash

# bash strict settings
set -o errexit # exit on errors
set -o nounset # exit on use of uninitialized variable
set -o pipefail

import colors
import echoerr

source ./commands/inc.sh

(( $# != 0 )) || echoerrandexit "No command given. Try:\n${bold}${green}gtk help${reset}"

COMMAND="${1}"; shift

# TODO: check if there are other parameters

case "$COMMAND" in
  list-hotfixes)
    $COMMAND;;
  *)
    echoerrandexit "Unkown command. Try:\n${bold}${green}gtk help${reset}";;
esac
