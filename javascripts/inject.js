$(function() {
    var setStatus = function(sha, state) {
        $('[data-commit-id="' + sha + '"]').attr('data-commit-status', state);
    };

    var pageOwner = function() {
        var match = /^\/(.+?)(?:\/.*)*$/.exec(URI(document.location).pathname());
        if (match !== null) {
            return match[1];
        }
        return null;
    };

    var pageProject = function() {
        var match = /^\/(?:.+?)\/(.+?)(?:\/.*)*$/.exec(URI(document.location).pathname());
        if (match !== null) {
            return match[1];
        }
        return null;
    };

    var pageDomain = function() {
        return document.location.host;
    };

    var Project = function(options) {
        _.defaults(this, options, {
            domain: pageDomain(),
            owner: pageOwner(),
            name: pageProject()
        });
    };

    _.extend(Project.prototype, {
        toString: function() {
            return _.string.sprintf("GitHub Project: https://%s/%s/%s", this.domain, this.owner, this.name);
        }
    });

    var shas = [];
    shas = shas.concat(_.map($('a.sha-block, a.sha, .commit-links a.gobutton'), function (el) {
        var href = el.getAttribute('href');
        match = /.*commit\/([0-9a-f]{40})/.exec(href);
        if (match !== null) {
            var sha = $(el).children('.sha');
            if (sha.length === 0) {
                sha = $(el, '.sha');
            }
            sha.attr('data-commit-id', match[1]);
            setStatus(match[1], 'unknown');
            return match[1];
        }
    }));
    shas = shas.concat(_.map($('.sha-block .sha'), function(el) {
        var text = $(el).text();
        if (/[0-9a-f]{40}/.exec(text)) {
            $(el).attr('data-commit-id', text);
            setStatus(match[1], 'unknown');
            return text;
        }
    }));
    shas = _.unique(_.compact(shas));

    _.each(shas, function (sha) {
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
    });
});
