function gtk-hotfixes() {
  local ACTION="${1}"; shift

  if [[ $(type -t "gtk-hotfixes-${ACTION}" || echo '') == 'function' ]]; then
    gtk-hotfixes-${ACTION} "$@"
  else
    echoerrandexit "Unknown hotfixes action: ${bold}${ACTION}${reset}"
  fi
}

gtk-hotfixes-list() {
  # TODO: implement '--no-color' (from global option?)
  git log --no-merges --first-parent --pretty=oneline --decorate=full --min-parents=1 --color | grep --color=always -Fv 'tag: refs/tags'
}
