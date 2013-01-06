$(function() {
    // Attempt to detect github, bail if not found
    if ($('head').attr('prefix').match(/githubog:/) === null) {
        return;
    }

    var setStatus = function(sha, state) {
        $('[data-commit-id="' + sha + '"]').attr('data-commit-status', state);
    };

    var processShaElement = function(element, sha) {
        element.attr('data-commit-id', sha);
        setStatus(sha, 'unknown');
        return sha;
    };

    var Project = function(options) {
        _.defaults(this, options, {
            domain: this.pageDomain(),
            owner: this.pageOwner(),
            name: this.pageProject()
        });
    };

    _.extend(Project.prototype, {
        toString: function() {
            return _.string.sprintf("GitHub Project: https://%s/%s/%s", this.domain, this.owner, this.name);
        },

        pageDomain: function() {
            return document.location.host;
        },

        pageProject: function() {
            var match = /^\/(?:.+?)\/(.+?)(?:\/.*)*$/.exec(URI(document.location).pathname());
            if (match !== null) {
                return match[1];
            }
            return null;
        },

        pageOwner: function() {
            var match = /^\/(.+?)(?:\/.*)*$/.exec(URI(document.location).pathname());
            if (match !== null) {
                return match[1];
            }
            return null;
        }
    });

    var findAllShas = function (el) {
        var shas = [];
        var links = $(el).find('a.sha-block, a.sha, .commit-links a.gobutton');
        var sha_blocks = $(el).find('.sha-block .sha');

        shas = shas.concat(_.map(links, function (el) {
            var href = el.getAttribute('href');
            match = /.*commit\/([0-9a-f]{40})/.exec(href);
            if (match !== null) {
                var sha = $(el).children('.sha');
                if (sha.length === 0) {
                    sha = $(el, '.sha');
                }
                return processShaElement($(sha), match[1]);
            }
        }));

        shas = shas.concat(_.map(sha_blocks, function (el) {
            var text = $(el).text();
            if (/[0-9a-f]{40}/.exec(text)) {
                return processShaElement($(el), text);
            }
        }));

        shas = _.unique(_.compact(shas));

        return shas;
    };

    var updateShaStatus = function (sha) {
        var proj = new Project();
        var projData = localStorage[proj.toString()];
        if (!projData) {
            localStorage[proj.toString()] = projData = {};
        }
        var oldStatus = projData[sha];
        setStatus(sha, oldStatus);

        var uri = new URI();
        uri.protocol('https');
        if (proj.domain == 'github.com') {
            uri.host('api.github.com');
            uri.pathname('/');
        } else {
            // Enterprise
            uri.host(proj.domain);
            uri.pathname('/api/v3/');
        }
        uri.pathname(uri.pathname() + _.string.sprintf('repos/%s/%s/statuses/%s', proj.owner, proj.name, sha));
        $.ajax(uri.toString()).then(function(data) {
            if (data.length === 0) {
                return;
            }
            var latestStatus = data[0];
            projData[sha] = latestStatus.state;
            setStatus(sha, latestStatus.state);
        });
    };

    _.each(findAllShas(document), updateShaStatus);
});
