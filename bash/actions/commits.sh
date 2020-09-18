function gtk-commits() {
  local ACTION="${1}"; shift

  if [[ $(type -t "gtk-commits-${ACTION}" || echo '') == 'function' ]]; then
    gtk-commits-${ACTION} "$@"
  else
    echoerrandexit "Unknown commits action: ${bold}${ACTION}${reset}"
  fi
}

gtk-commits-list() {
  eval "$(setSimpleOptions BEFORE_AND= SINCE_AND= CONTENT= -- "$@")"

  local RANGE="" # default to all time

  if [[ -z "${CONTENT}" ]]; then
    echoerrandexit "DEFAULT MODE NOT YET IMPLEMENTED"
  elif [[ "latest-release" == "$CONTENT" ]]; then
    local BOUNDS
    [[ -z "$BEFORE_AND" ]] || BOUNDS="--merged ${BEFORE_AND}"
    [[ -z "$SINCE_AND" ]] || BOUNDS="${BOUNDS} --contains ${SINCE_AND}"
    echo "git tag ${BOUNDS} --sort='v:refname' | tail -n 1" >&2
    # RANGE=`git tag ${BOUNDS} --sort='v:refname' | tail -n 1`
    git tag ${BOUNDS} --sort='v:refname' | tail -n 1
  elif [[ "hotfixes" == "$CONTENT" ]]; then
    if [[ -n "$BEFORE_AND" ]] || [[ -n "$SINCE_AND" ]]; then
      if [[ -z "$BEFORE_AND" ]]; then
        RANGE="${SINCE_AND}..HEAD"
      elif [[ -z "$SINCE_AND" ]]; then
        local INITIAL_COMMIT
        INITIAL_COMMIT=`git rev-list --max-parents=0 HEAD`
        # TODO: check and warn if multiple initial commits
        RANGE="${INITIAL_COMMIT}..${BEFORE_AND}"
      else
        RANGE="${SINCE_AND}..${BEFORE_AND}"
      fi
    fi
    # TODO: implement '--no-color|-C' (from global option?)
    git log --no-merges --first-parent --pretty=oneline --decorate=full --min-parents=1 --color $RANGE | grep --color=always -Fv 'tag: refs/tags'
  else
    echoerrandexit "No such content type: ${CONTENT}. ${green}Use smart autocomplete or try:\ngtk help list${reset}"
  fi
}
