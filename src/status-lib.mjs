import createError from 'http-errors'

import { determineOriginAndMain } from './branch-and-remotes-lib'
import { tryExec } from './lib/try-exec'

/**
 * Verifies the current branch is clean.
 */
const verifyClean = ({ projectPath, reporter }) => {
  reporter?.push('Checking working directory is clean...')
  const cleanResult = tryExec(`cd '${projectPath}' && git status --porcelain`,
    { msg : `Could not execute 'git status' in dir '${projectPath}'.` })
  if (cleanResult.stdout.length > 0) { throw createError.BadRequest(`git repo at '${projectPath}' is not clean.`) }
}

const verifyMainBranchUpToDate = ({ projectPath, reporter }) => {
  const [originRemote, mainBranch] = determineOriginAndMain({ projectPath })

  // Update main branch so we can check we're in sync
  reporter?.push(`Checking ${originRemote} HEAD is up-to-date...`)
  tryExec(`cd '${projectPath}' && git fetch -q ${originRemote} ${mainBranch}`,
    { msg : `Could not update ${originRemote}/${mainBranch}.` })

  const originHead = tryExec(`cd '${projectPath}' && git rev-parse ${originRemote}/${mainBranch}`,
    { msg : `Could not determnie version for ${originRemote}/${mainBranch}.` })
  const localHead = tryExec(`cd '${projectPath}' && git rev-parse ${mainBranch}`,
    { msg : `Could not determnie version for ${mainBranch}.` })

  if (originHead.stdout !== localHead.stdout) { throw createError.BadRequest(`Local and ${originRemote} '${mainBranch} are not in sync. Try:\n\ngit fetch ${originRemote} ${mainBranch} \\\n  && git merge ${originRemote}/${mainBranch}\\\n  && git push ${originRemote} ${mainBranch}`) }
}

/**
 * Verifies that the repo is ready for release by verifyirg we are on the main or release branch, the repo is clean,
 * the main branch is up to date with the origin remote and vice-a-versa, and there is a package 'qa' script that
 * passes.
 */
const verifyReadyForRelease = ({
  currentBranch,
  mainBranch,
  originRemote,
  packageSpec,
  projectPath,
  releaseBranch,
  reporter
}) => {
  reporter?.push('Checking current branch valid...')
  if (currentBranch === releaseBranch) reporter.push(`  already on release branch ${releaseBranch}.`)
  else if (currentBranch !== mainBranch) { throw createError.BadRequest(`Release branch can only be cut from main branch '${mainBranch}'; current branch: '${currentBranch}'.`) }

  verifyClean({ projectPath, reporter })
  verifyMainBranchUpToDate({ projectPath, reporter })

  reporter?.push("Checking for and running 'qa' script...")
  if ('qa' in packageSpec.scripts) {
    tryExec(`cd '${projectPath}' && npm run qa`, { httpStatus : 400, msg : 'Project must pass QA prior to release.' })
  }
  else throw createError.BadRequest("You must define a 'qa' script to be run prior to release.")
}

export { verifyClean, verifyMainBranchUpToDate, verifyReadyForRelease }
