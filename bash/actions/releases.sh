function gtk-releases() {
  local ACTION="${1}"; shift

  if [[ $(type -t "gtk-releases-${ACTION}" || echo '') == 'function' ]]; then
    gtk-releases-${ACTION} "$@"
  else
    echoerrandexit "Unknown releases action: ${bold}${ACTION}${reset}"
  fi
}

gtk-releases-latest() {
  git tag --sort='v:refname' | tail -n 1
}
