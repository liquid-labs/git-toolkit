import { tryExec } from '@liquid-labs/shell-toolkit'

const determineAuthorEmail = () => {
  const result = tryExec('git config --global user.email')
  return result.stdout.trim()
}

export { determineAuthorEmail }