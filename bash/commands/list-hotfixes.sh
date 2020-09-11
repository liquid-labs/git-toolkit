function list-hotfixes {
  # TODO: implement '--no-color' (from global option?)
  git log --no-merges --first-parent --pretty=oneline --decorate=full --min-parents=1 --color | grep --color=always -Fv 'tag: refs/tags'
}
