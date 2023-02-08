/* globals describe expect test */
import * as fsPath from 'node:path'

import { determineCurrentBranch, determineOriginAndMain } from '../branch-and-remotes-lib'

describe('determineCurrentBranch', () => {
  test.each([
    ['repo_a', 'main'],
    ['repo_b', 'work-branch']
  ])("'%s' is on branch '%s'", (repo, branch) =>
    expect(determineCurrentBranch({ projectPath : fsPath.join('src', 'test', 'data', repo) })).toBe(branch))
})

describe('determineOriginAndMain', () => {
  test.each([
    ['repo_a_clone', 'origin', 'main'],
    ['repo_a_clone_2', 'upstream', 'main']
  ])("'%s' has origin / main '%s' / '%s'", (repo, origin, main) =>
    expect(determineOriginAndMain({ projectPath : fsPath.join('src', 'test', 'data', repo) })).toEqual([origin, main]))
})
