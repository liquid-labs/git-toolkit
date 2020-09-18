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

  local FILTER_OPTS
  local POST_FILTER

  if [[ -z "${CONTENT}" ]]; then
    FILTER_OPTS="--decorate-refs='refs/tags/*'"
    POST_FILTER=""
  elif [[ "latest-release" == "$CONTENT" ]]; then
    FILTER_OPTS="--no-walk --tags --decorate-refs='refs/tags/*'"
    POST_FILTER="| grep -F 'tag: refs/tags' | head -n 1"
  elif [[ "hotfixes" == "$CONTENT" ]]; then
    # --no-merges : excludes the workbranch merges
    # --first-parent says to follow the 'master' branch and don't walk into merge branches
    # --min-parent=1 : excludes the initial commit, if any; that's not a hotfix.
    FILTER_OPTS="--no-merges --first-parent --min-parents=1"
    POST_FILTER="| grep -Fv 'tag: refs/tags'"
  else
    echoerrandexit "No such content type: ${CONTENT}. ${green}Use smart autocomplete or try:\ngtk help list${reset}"
  fi

  # TODO: implement '--no-color|-C' (from global option?)
  # --decorate=full : says to print the full refspec with '%d' so we can filter it (the tags) out
  # %x09 : a tab
  # TODO: would love to add a header, but don't see a way to add that to the 'git log' and 'column' doesn't work well with 'git log'. Not sure why but adding:
  # { echo -e "Hash\tWhen\tMessage\tRef";... ; } | column -s $'\t' -t
  # generally does not format rightand outputs 'column: line too long'. Different 'expand-tabs' did not seem to help.
  # TODO: can we factor out the eval? It's necessary to get the (possible) '|' in 'POST_FILTER' to get treated as a bash operator rather than a literal pipe.
  eval "git log $FILTER_OPTS --color --no-expand-tabs --decorate=full --pretty=format:'%C(bold 214)%<(7,trunc)%h%C(reset)%x09%C(dim white)%cr%C(reset)%x09%<|(64,trunc)%s%x09%d' ${RANGE} -- | sed -n 's/  */ /gp' ${POST_FILTER} | column -s $'\t' -t"
}
