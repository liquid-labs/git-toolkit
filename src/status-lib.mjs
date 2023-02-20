import createError from 'http-errors'

import { tryExec } from '@liquid-labs/shell-toolkit'

import { determineOriginAndMain } from './branch-and-remotes-lib'

const verifyBranchInSync = ({ branch, description, projectPath, remote, reporter }) => {
  if (description !== undefined) description += ' '

  // Update local branch so we can check we're in sync
  reporter?.push(`Fetching ${remote} ${branch}...`)
  tryExec(`cd '${projectPath}' && git fetch -q ${remote} ${branch}`,
    { msg : `Could not update ${description}branch ${remote}/${branch}.` })

  reporter?.push(`Checking local and remote versions...`)
  const originHead = tryExec(`cd '${projectPath}' && git rev-parse ${remote}/${branch}`,
    { msg : `Could not determnie version for ${description}branch ${remote}/${branch} HEAD.` })
  const localHead = tryExec(`cd '${projectPath}' && git rev-parse ${branch}`,
    { msg : `Could not determnie version for local ${description}branch ${branch} HEAD.` })

  if (originHead.stdout !== localHead.stdout) {
    throw createError.BadRequest(`Local and ${remote} ${branch} ${description}branches are not in sync. Try:\n\ngit fetch ${remote} ${branch} \\\n  && git merge ${remote}/${branch}\\\n  && git push ${remote} ${branch}`) 
  }
}

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

  verifyBranchInSync({ branch: mainBranch, description: 'main', projectPath, remote: originRemote, reporter })
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

export { verifyBranchInSync, verifyClean, verifyMainBranchUpToDate, verifyReadyForRelease }
