function gtk-hotfixes() {
  local ACTION="${1}"; shift

  if [[ $(type -t "gtk-hotfixes-${ACTION}" || echo '') == 'function' ]]; then
    gtk-hotfixes-${ACTION} "$@"
  else
    echoerrandexit "Unknown hotfixes action: ${bold}${ACTION}${reset}"
  fi
}

gtk-hotfixes-list() {
  local SINCE="${1:-}"

  local RANGE=""
  if [[ -n "$SINCE" ]]; then
    RANGE="$SINCE...HEAD"
  fi
  # TODO: implement '--no-color|-C' (from global option?)
  git log --no-merges --first-parent --pretty=oneline --decorate=full --min-parents=1 --color $RANGE | grep --color=always -Fv 'tag: refs/tags'
}
