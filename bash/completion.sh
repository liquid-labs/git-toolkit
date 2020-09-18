# After updating this file, run './install.sh' and open a new terminal for the
# changes to take effect.

# TODO: we could generate this from the help docs... make the spec central!
_gtk() {
  local GLOBAL_ACTIONS="help"
  local ACTION_GROUPS="commits"

  local TOKEN COMP_FUNC CUR OPTS PREV WORK_COUNT TOKEN_COUNT
  CUR="${COMP_WORDS[COMP_CWORD]}"
  PREV="${COMP_WORDS[COMP_CWORD-1]}"
  COMP_FUNC='comp'
  WORD_COUNT=${#COMP_WORDS[@]}
  TOKEN_COUNT=0

  no-opts() {
    COMPREPLY=( $(compgen -W "" -- ${CUR}) )
  }

  std-reply() {
    COMPREPLY=( $(compgen -W "${OPTS}" -- ${CUR}) )
  }

  comp-gtk() {
    OPTS="${GLOBAL_ACTIONS} ${ACTION_GROUPS}"; std-reply
  }

  comp-gtk-help() {
    OPTS="${ACTION_GROUPS}"; std-reply
  }

  comp-func-builder() {
    local TOKEN_PATH="${1}"
    local VAR_KEY="${2}"
    local NO_SQUASH_ACTIONS="${3:-}"
    local OPT
    local ACTIONS_VAR="${VAR_KEY}_ACTIONS"
    local GROUPS_VAR="${VAR_KEY}_GROUPS"
    echo "comp-gtk-${TOKEN_PATH}() { OPTS=\"${!ACTIONS_VAR:-} ${!GROUPS_VAR:-}\"; std-reply; }"
    echo "comp-gtk-help-${TOKEN_PATH}() { comp-gtk-${TOKEN_PATH}; }"
    for OPT in ${!ACTIONS_VAR}; do
      if [[ -z "$NO_SQUASH_ACTIONS" ]] || ! type -t comp-gtk-${TOKEN_PATH}-${OPT} | grep -q 'function'; then
        echo "function comp-gtk-${TOKEN_PATH}-${OPT}() { no-opts; }"
        echo "function comp-gtk-help-${TOKEN_PATH}-${OPT}() { no-opts; }"
      fi
    done
  }

  # commits group
  local COMMITS_ACTIONS="list"
  local COMMITS_GROUPS=""
  eval "$(comp-func-builder 'commits' 'COMMITS')"
  comp-gtk-commits-list() {
    local FORMAT_OPTS="feature-list tag-only"

    if [[ "$PREV" == "--content" ]]; then
      OPTS="latest-release hotfixes"
    elif [[ "$PREV" == "--format" ]]; then
      OPTS="${FORMAT_OPTS}"
    elif [[ "$PREV" == "--before-and" ]] || [[ "$PREV" == "--since-and" ]]; then
      OPTS=`git tag` # TODO: use before and since boundaries to limit if set
    else
      local MY_OPTS="--before-and --since-and --content --format"
      local MY_OPT
      for MY_OPT in ${MY_OPTS}; do
        [[ $COMP_LINE != *" ${MY_OPT}"* ]] && OPTS="${MY_OPT} ${OPTS}"
      done
    fi

    std-reply
  }

  # Now we've registered all the local and modular completion functions. We'll analyze the token stream to figure out
  # which completion function to call:
  for TOKEN in ${COMP_WORDS[@]}; do
    if [[ "$TOKEN" != -* ]] && (( $TOKEN_COUNT + 1 < $WORD_COUNT )); then
      if [[ "$(type -t "${COMP_FUNC}-${TOKEN}")" == 'function' ]]; then
        COMP_FUNC="${COMP_FUNC}-${TOKEN}"
        TOKEN_COUNT=$(( $TOKEN_COUNT + 1 ))
      fi
    else
      TOKEN_COUNT=$(( $TOKEN_COUNT + 1 ))
    fi
  done

  # Execute the compeltion function determined above:
  $COMP_FUNC
  return 0
}

complete -F _gtk gtk
