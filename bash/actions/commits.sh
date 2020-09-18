function gtk-commits() {
  local ACTION="${1}"; shift

  if [[ $(type -t "gtk-commits-${ACTION}" || echo '') == 'function' ]]; then
    gtk-commits-${ACTION} "$@"
  else
    echoerrandexit "Unknown commits action: ${bold}${ACTION}${reset}"
  fi
}

gtk-commits-list() {
  eval "$(setSimpleOptions BEFORE_AND= SINCE_AND= CONTENT= FORMAT= -- "$@")"

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
  local CONTENT_FILTER
  local LOG_FORMAT="format:'%C(bold 214)%<(7,trunc)%h%C(reset)%x09%C(dim white)%cr%C(reset)%x09%<|(64,trunc)%s%x09%D'"
  local TABLE_MODE=true

  if [[ -z "${CONTENT}" ]] || [[ "all" == $CONTENT ]]; then
    FILTER_OPTS="--decorate-refs='refs/tags/*'"
    CONTENT_FILTER=""
  elif [[ "latest-release" == "$CONTENT" ]]; then
    FILTER_OPTS="--no-walk --tags --decorate-refs='refs/tags/*'"
    CONTENT_FILTER="| grep -F 'tag: refs/tags' | head -n 1"
  elif [[ "hotfixes" == "$CONTENT" ]]; then
    # --no-merges : excludes the workbranch merges
    # --first-parent says to follow the 'master' branch and don't walk into merge branches
    # --min-parent=1 : excludes the initial commit, if any; that's not a hotfix.
    FILTER_OPTS="--no-merges --first-parent --min-parents=1"
    CONTENT_FILTER="| grep -Fv 'tag: refs/tags'"
  else
    echoerrandexit "No such content type: ${CONTENT}. ${green}Use smart autocomplete or try:\ngtk help list${reset}"
  fi

  # we use the 'full' decoration to make filtering easy, but we actually want to display the simple tag
  CONTENT_FILTER="$CONTENT_FILTER | sed -e 's|tag: refs/tags/||'"
  # now deal with format options
  [[ -z "$FORMAT" ]] || { \
    case "${FORMAT}" in
      full) :;;# nothing to do
      tag-only)
        CONTENT_FILTER="$CONTENT_FILTER | awk -F \$'\t' '{ print \$4 }' | sed '/^\$/d'";;
      feature-list)
        CONTENT_FILTER="$CONTENT_FILTER | awk -F \$'\t' '{ print \$1\"\\t\"\$3 }'";;
      graph)
        if [[ -n $CONTENT ]] && [[ $CONTENT != "all" ]]; then
          echoerrandexit "Graph output is incompatible with limited content."
        fi
        TABLE_MODE='' # bash false
        FILTER_OPTS="--decorate-refs-exclude='refs/heads/*' --decorate-refs-exclude='*/*/master' --graph --all --decorate=short"
        LOG_FORMAT="format:'+%C(bold 214)%<(7,trunc)%h%C(reset)+%C(dim white)%>(12,trunc)%cr%C(reset)+%C(white)%s%C(reset)+%C(214)%D%C(reset)'";;
      *)
        echoerrandexit "Unknown format option: ${FORMAT}";;
    esac; }

  local TABLE_OPTS
  local TABLE_FILTER
  if [[ -n $TABLE_MODE ]]; then
    TABLE_OPTS='--no-expand-tabs --decorate=full'
    TABLE_FILTER="| sed -n 's/  */ /gp' ${CONTENT_FILTER} | column -s $'\t' -t"
  fi
  # TODO: implement '--no-color|-C' (from global option?)
  # --decorate=full : says to print the full refspec with '%d' so we can filter it (the tags) out
  # %x09 : a tab
  # TODO: would love to add a header, but don't see a way to add that to the 'git log' and 'column' doesn't work well with 'git log'. Not sure why but adding:
  # { echo -e "Hash\tWhen\tMessage\tRef";... ; } | column -s $'\t' -t
  # generally does not format rightand outputs 'column: line too long'. Different 'expand-tabs' did not seem to help.
  # TODO: can we factor out the eval? It's necessary to get the (possible) '|' in 'CONTENT_FILTER' to get treated as a bash operator rather than a literal pipe.
  eval "git log $FILTER_OPTS --color ${TABLE_OPTS} --pretty=${LOG_FORMAT} ${RANGE} -- ${TABLE_FILTER}"
}
