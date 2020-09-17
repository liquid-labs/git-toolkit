#!/usr/bin/env bash

import echoerr
import fileslib

COMPLETION_PATH="/usr/local/etc/bash_completion.d"
COMMAND_NAME="gtk"
MY_COMPLETION="./bash/completion.sh"

BREW_UPDATED=''
brewInstall() {
  local EXEC="$1"
  local INSTALL_TEST="$2"
  local POST_INSTALL="${3:-}"
  if ! $INSTALL_TEST; then
    if ! which -s brew; then
      echoerr "Required executable '${EXEC}' not found."
      echoerr "Install Homebrew and re-run installation, or install '${EXEC}' manually."
      echoerrandexit https://brew.sh/
    fi
    # else
    doInstall() {
      test -n "${BREW_UPDATED}" \
        || brew update \
        || echoerrandexit "'brew update' exited with errors. Please update Homebrew and re-run ${COMMAND_NAME} installation."
      BREW_UPDATED=true
      brew install $EXEC \
        || (echo "First install attempt failed. Re-running often fixes brew install issue; trying again..."; brew install $EXEC) \
        || echoerrandexit "'brew install ${EXEC}' exited with errors. Otherwise, please install '${EXEC}' and re-run ${COMMAND_NAME} installation."
      if test -n "$POST_INSTALL"; then eval "$POST_INSTALL"; fi
    }
    giveFeedback() {
      echo "${COMMAND_NAME} requires '${EXEC}'. Please install with Homebrew (recommended) or manually."
      exit
    }
    yes-no \
      "${COMMAND_NAME} requires command '${EXEC}'. OK to attempt install via Homebrew? (Y/n) " \
      Y \
      doInstall \
      giveFeedback
  fi
}

if [[ $(uname) == 'Darwin' ]]; then
  brewInstall jq 'which -s jq'
  # Without the 'eval', the tick quotes are treated as part of the filename.
  # Without the tickquotes we're vulnerable to spaces in the path.
  brewInstall gnu-getopt \
    "eval test -f '$(brew --prefix gnu-getopt)/bin/getopt'" \
    "addLineIfNotPresentInFile ~/.bash_profile 'alias gnu-getopt=\"\$(brew --prefix gnu-getopt)/bin/getopt\"'"
else
  apt-get -q update
  apt-get install -qqy jq
fi

cp "${MY_COMPLETION}" "${COMPLETION_PATH}/${COMMAND_NAME}"
fileslib-append-string ~/.bash_profile "[ -d '$COMPLETION_PATH' ] && . '${COMPLETION_PATH}/${COMMAND_NAME}'"
# TODO: accept '-e' option which exchos the source command so user can do 'eval ./install.sh -e'
# TODO: only echo if lines added (here or in POST_INSTALL)
echo "You must open a new shell or 'source ~/.bash_profile' to enable completion updates."
