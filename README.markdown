GitHub Commit Status Coloration
========

Colors SHAs on GitHub with their commit status.

![Screenshot](http://cl.ly/image/410g0S02442D/Image%202012.12.26%207:19:48%20PM.png)

As far as I know, there's only one place to view the CI status of a commit on github - in the pull request view. This is unfortunate, so I've created this extension to color commit IDs according to their status.

Notes:
 * Everything is very rudimentary- literally the very least amount I could do to get this in a working state. Forks & pull requests welcome!
 * I don't know if this will work on private repositories when logged in; I assume the user's cookies take effect when making the API request.
 * Supports enterprise (this is in fact my primary use case), but I don't know the correct way to allow users to specify what domains the extension has access to (see issue #1)
 * This is my first chrome extension, so it was cloned from https://github.com/alvincrespo/Chrome-Extensions-Boilerplate and has unnecessary stuff in v0.1
