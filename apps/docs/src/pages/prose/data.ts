/** What a markdown renderer hands Prose: every element it styles, once. */
export const article = `<h3>Deploying a preview</h3>
<p>A preview is built from any branch you push. It gets its own address, and its checks run before anyone is asked to look at it — see <a href="#/prose">how checks are chosen</a>.</p>
<h4>Before you push</h4>
<ol><li>Run <code>npm test</code> and <code>npm run typecheck</code>.</li><li>Keep the branch rebased on <code>main</code>.</li><li>Press <kbd>Ctrl</kbd> <kbd>K</kbd> and choose <em>Deploy preview</em>.</li></ol>
<blockquote><p>A preview that fails its checks is kept for a day, so the failure can be read.</p></blockquote>
<pre><code>npm run deploy -- --preview feature/billing</code></pre>
<h4>Limits</h4>
<table><thead><tr><th>Plan</th><th>Previews</th><th>Kept for</th></tr></thead><tbody><tr><td>Free</td><td>3</td><td>7 days</td></tr><tr><td>Team</td><td>25</td><td>30 days</td></tr></tbody></table>
<hr>
<p>Previews older than their plan allows are removed at night, <mark>without notice</mark>.</p>`
