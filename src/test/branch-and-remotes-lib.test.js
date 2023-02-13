/* globals describe expect test */
import * as fsPath from 'node:path'

import { determineCurrentBranch, determineOriginAndMain, hasBranch, hasRemote } from '../branch-and-remotes-lib'

describe('determineCurrentBranch', () => {
  test.each([
    ['repo_a', 'main'],
    ['repo_b', 'work-branch']
  ])("'%s' is on branch '%s'", (repo, branch) =>
    expect(determineCurrentBranch({ projectPath : fsPath.join('test-staging', 'data', repo) })).toBe(branch))
})

describe('determineOriginAndMain', () => {
  test.each([
    ['repo_a_clone', 'origin', 'main'],
    ['repo_a_clone_2', 'upstream', 'main']
  ])("'%s' has origin / main '%s' / '%s'", (repo, origin, main) =>
    expect(determineOriginAndMain({ projectPath : fsPath.join('test-staging', 'data', repo) })).toEqual([origin, main]))
})

describe('hasBranch', () => {
  test.each([
    ['repo_a', 'main', true],
    ['repo_a', 'bar', true],
    ['repo_a', 'foo', false]
  ])("'%s' has branch '%s' => %p", (repo, branch, present) =>
    expect(hasBranch({ branch, projectPath : fsPath.join('test-staging', 'data', repo) })).toBe(present))
})

describe('hasRemote', () => {
  test.each([
    ['repo_a', 'origin', false],
    ['repo_a_clone', 'origin', true],
    ['repo_a_clone_2', 'origin', false],
    ['repo_a_clone_2', 'upstream', true],
    ['repo_a_clone_2', 'coworker', true]
  ])("'%s' has remote '%s' => %p", (repo, remote, present) =>
    expect(hasRemote({ remote, projectPath : fsPath.join('test-staging', 'data', repo) })).toBe(present))
})
