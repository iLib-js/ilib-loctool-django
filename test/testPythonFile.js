/*
 * testPythonFile.js - test the Python file handler object.
 *
 * Copyright © 2021, Box, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var path = require("path");

if (!PythonFile) {
    var PythonFile = require("../PythonFile.js");
    var PythonFileType = require("../PythonFileType.js");
    var CustomProject =  require("loctool/lib/CustomProject.js");
    var ContextResourceString =  require("loctool/lib/ContextResourceString.js");
}

var p = new CustomProject({
    id: "webapp",
    sourceLocale: "en-US",
    pseudoLocale: "de-DE",
    plugins: [
        path.join(process.cwd(), "PythonFileType")
    ]
}, "./test/testfiles", {
    locales:["en-GB"]
});

var pft = new PythonFileType(p);

module.exports.pyfile = {
    // make sure to initialize the file types so that the tests below can use
    // a ContextResourceString instead of a regular ResourceString
    testPythonInit: function(test) {
        p.init(function() {
            test.done();
        });
    },

    testPythonFileConstructor: function(test) {
        test.expect(1);

        var pf = new PythonFile({
            project: p
        });
        test.ok(pf);

        test.done();
    },

    testPythonFileConstructorParams: function(test) {
        test.expect(1);

        var pf = new PythonFile({
            project: p,
            pathName: "./testfiles/python/t1.py",
            type: pft
        });

        test.ok(pf);

        test.done();
    },

    testPythonFileConstructorNoFile: function(test) {
        test.expect(1);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        test.done();
    },

    testPythonFileMakeKey: function(test) {
        test.expect(2);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        test.equal(pf.makeKey("This is a test"), "This is a test");

        test.done();
    },

    testPythonFileParseSimpleGetByKey: function(test) {
        test.expect(5);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('_("This is a test")');

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.get(ContextResourceString.hashKey("webapp", undefined, "en-US", "This is a test", "python"));
        test.ok(r);

        test.equal(r.getSource(), "This is a test");
        test.equal(r.getKey(), "This is a test");

        test.done();
    },

    testPythonFileParseSimpleGetBySource: function(test) {
        test.expect(5);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('_("This is a test")');

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is a test");
        test.ok(r);
        test.equal(r.getSource(), "This is a test");
        test.equal(r.getKey(), "This is a test");

        test.done();
    },

    testPythonFileParseRightFunction: function(test) {
        test.expect(5);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        // get the underscore-brackets, but only if it is the whole name of
        // the function
        pf.parse('foo_("This is a test")');

        var set = pf.getTranslationSet();
        test.ok(set);

        test.equal(set.size(), 0);

        test.done();
    },

    testPythonFileParseIgnoreEmpty: function(test) {
        test.expect(3);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('_("")');

        var set = pf.getTranslationSet();
        test.ok(set);

        test.equal(set.size(), 0);

        test.done();
    },

    testPythonFileParseSimpleIgnoreWhitespace: function(test) {
        test.expect(5);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('   _  (    \t "This is a test"    )  ');

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is a test");
        test.ok(r);
        test.equal(r.getSource(), "This is a test");
        test.equal(r.getKey(), "This is a test");

        test.done();
    },

    testPythonFileParseSimpleRightSize: function(test) {
        test.expect(4);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        var set = pf.getTranslationSet();
        test.equal(set.size(), 0);

        pf.parse('_("This is a test")');

        test.ok(set);

        test.equal(set.size(), 1);

        test.done();
    },

    testPythonFileParseGettext: function(test) {
        test.expect(5);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('gettext("This is a test")');

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is a test");
        test.ok(r);
        test.equal(r.getSource(), "This is a test");
        test.equal(r.getKey(), "This is a test");

        test.done();
    },

    testPythonFileParseGettextLazy: function(test) {
        test.expect(5);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('gettext_lazy("This is a test")');

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is a test");
        test.ok(r);
        test.equal(r.getSource(), "This is a test");
        test.equal(r.getKey(), "This is a test");

        test.done();
    },

    testPythonFileParseGettextNoop: function(test) {
        test.expect(5);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('gettext_noop("This is a test")');

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is a test");
        test.ok(r);
        test.equal(r.getSource(), "This is a test");
        test.equal(r.getKey(), "This is a test");
        test.equal(r.getComment(), "DO NOT TRANSLATE");

        test.done();
    },

    testPythonFileParsePgettext: function(test) {
        test.expect(5);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('pgettext("This is a test", "This is context")');

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is a test");
        test.ok(r);
        test.equal(r.getSource(), "This is a test");
        test.equal(r.getKey(), "This is a test");
        test.equal(r.getContext(), "This is context");

        test.done();
    },

    testPythonFileParsePgettextLazy: function(test) {
        test.expect(5);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('pgettext_lazy("This is a test", "This is context")');

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is a test");
        test.ok(r);
        test.equal(r.getSource(), "This is a test");
        test.equal(r.getKey(), "This is a test");
        test.equal(r.getContext(), "This is context");

        test.done();
    },

    testPythonFileParseNgettext: function(test) {
        test.expect(8);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('ngettext("This is the singular", "This is the plural", count)');

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is the singular");
        test.ok(r);
        test.equal(r.getType, "plural");
        var pl = r.getSourcePlurals();
        test.ok(pl);
        test.equal(pl.one, "This is the singular");
        test.equal(pl.other, "This is the plural");
        test.equal(r.getKey(), "This is the singular");

        test.done();
    },

    testPythonFileParseNgettextLazy: function(test) {
        test.expect(8);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('ngettext_lazy("This is the singular", "This is the plural", count)');

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is the singular");
        test.ok(r);
        test.equal(r.getType, "plural");
        var pl = r.getSourcePlurals();
        test.ok(pl);
        test.equal(pl.one, "This is the singular");
        test.equal(pl.other, "This is the plural");
        test.equal(r.getKey(), "This is the singular");

        test.done();
    },

    testPythonFileParseNpgettext: function(test) {
        test.expect(8);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('npgettext("This is context", "This is the singular", "This is the plural", count)');

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is the singular");
        test.ok(r);
        test.equal(r.getType, "plural");
        var pl = r.getSourcePlurals();
        test.ok(pl);
        test.equal(pl.one, "This is the singular");
        test.equal(pl.other, "This is the plural");
        test.equal(r.getKey(), "This is the singular");
        test.equal(r.getContext(), "This is context");

        test.done();
    },

    testPythonFileParseNpgettextLazy: function(test) {
        test.expect(8);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('npgettext_lazy("This is context", "This is the singular", "This is the plural", count)');

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is the singular");
        test.ok(r);
        test.equal(r.getType, "plural");
        var pl = r.getSourcePlurals();
        test.ok(pl);
        test.equal(pl.one, "This is the singular");
        test.equal(pl.other, "This is the plural");
        test.equal(r.getKey(), "This is the singular");
        test.equal(r.getContext(), "This is context");

        test.done();
    },

    testPythonFileParseSimpleWithTranslatorCommentLineBefore: function(test) {
        test.expect(6);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse(
            '\t# l10n this is a translator\'s comment\n' +
            '\t_("This is a test")\n' +
            '\tfoo("This is not")'
        );

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is a test");
        test.ok(r);
        test.equal(r.getSource(), "This is a test");
        test.equal(r.getKey(), "This is a test");
        test.equal(r.getComment(), "this is a translator's comment");

        test.done();
    },

    testPythonFileParseSimpleWithTranslatorCommentTripleQuoteBefore: function(test) {
        test.expect(6);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse(
            '\t"""\n' +
            '\tl10n this is a translator\'s comment\n' +
            '\t"""\n' +
            '\t_("This is a test")\n' +
            '\tfoo("This is not")'
        );

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is a test");
        test.ok(r);
        test.equal(r.getSource(), "This is a test");
        test.equal(r.getKey(), "This is a test");
        test.equal(r.getComment(), "this is a translator's comment");

        test.done();
    },

    testPythonFileParseSimpleWithTranslatorCommentSameLine: function(test) {
        test.expect(6);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('\t_("This is a test") # l10n this is a translator\'s comment\n\tfoo("This is not")');

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is a test");
        test.ok(r);
        test.equal(r.getSource(), "This is a test");
        test.equal(r.getKey(), "This is a test");
        test.equal(r.getComment(), "this is a translator's comment");

        test.done();
    },

    testPythonFileParseWithEmbeddedDoubleQuotes: function(test) {
        test.expect(5);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('\_("This is a \\\"test\\\".")');

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is a \"test\".");
        test.ok(r);
        test.equal(r.getSource(), "This is a \"test\".");
        test.equal(r.getKey(), "This is a \"test\".");

        test.done();
    },

    testPythonFileParseWithEmbeddedEscapedSingleQuotes: function(test) {
        test.expect(5);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('\t_("This is a \\\'test\\\'.")');

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is a 'test'.");
        test.ok(r);
        test.equal(r.getSource(), "This is a 'test'.");
        test.equal(r.getKey(), "This is a 'test'.");

        test.done();
    },

    testPythonFileParseWithEmbeddedUnescapedSingleQuotes: function(test) {
        test.expect(5);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('\t_("This is a \'test\'.")');

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is a 'test'.");
        test.ok(r);
        test.equal(r.getSource(), "This is a 'test'.");
        test.equal(r.getKey(), "This is a 'test'.");

        test.done();
    },

    testPythonFileParseWithEmbeddedEscapedWhiteSpace: function(test) {
        test.expect(5);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('\t_("This is a \\n\\ttest.")');

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is a \n\ttest.");
        test.ok(r);
        test.equal(r.getSource(), "This is a \n\ttest.");
        test.equal(r.getKey(), "This is a \n\ttest.");

        test.done();
    },

    testPythonFileParseWithSingleQuoteString: function(test) {
        test.expect(5);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse("\t_('This is a test.')");

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is a test.");
        test.ok(r);
        test.equal(r.getSource(), "This is a test.");
        test.equal(r.getKey(), "This is a test.");

        test.done();
    },

    testPythonFileParseWithRawString: function(test) {
        test.expect(5);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse("\t_(r'This is a raw \\' string.')");

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is a \\' string.");
        test.ok(r);
        test.equal(r.getSource(), "This is a \\' string.");
        test.equal(r.getKey(), "This is a \\' string.");

        test.done();
    },

    testPythonFileParseWithFString: function(test) {
        test.expect(5);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse("\t_(f'This is an {f} string.')");

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is an {f} string.");
        test.ok(r);
        test.equal(r.getSource(), "This is an {f} string.");
        test.equal(r.getKey(), "This is an {f} string.");

        test.done();
    },

    testPythonFileParseWithRawFString: function(test) {
        test.expect(5);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse("\t_(rf'This is an \\' {f} string.')");

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is an \\' {f} string.");
        test.ok(r);
        test.equal(r.getSource(), "This is an \\' {f} string.");
        test.equal(r.getKey(), "This is an \\' {f} string.");

        test.done();
    },

    testPythonFileParseWithUnicodeString: function(test) {
        test.expect(5);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse("\t_(u'This is a unicode string.')");

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is a unicode string.");
        test.ok(r);
        test.equal(r.getSource(), "This is a unicode string.");
        test.equal(r.getKey(), "This is a unicode string.");

        test.done();
    },

    testPythonFileParseWithMultilineString: function(test) {
        test.expect(5);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse(
            '\t_("""\n' +
            '\t  This is a\n' +
            '\t  multiline string.\n' +
            '\t""")');

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is a\n\tmultiline string.\n");
        test.ok(r);
        test.equal(r.getSource(), "This is a\n\tmultiline string.\n");
        test.equal(r.getKey(), "This is a\n\tmultiline string.\n");

        test.done();
    },

    testPythonFileParseMultiple: function(test) {
        test.expect(8);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse(
            '\t_("This is a test")\n' +
            '\ta.parse("This is another test.")\n' +
            '\t_("This is also a test")'
        );

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is a test");
        test.ok(r);
        test.equal(r.getSource(), "This is a test");
        test.equal(r.getKey(), "This is a test");

        r = set.getBySource("This is also a test");
        test.ok(r);
        test.equal(r.getSource(), "This is also a test");
        test.equal(r.getKey(), "This is also a test");

        test.done();
    },

/*
    testPythonFileParseMultipleWithKey: function(test) {
        test.expect(10);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('RB.getString("This is a test", "x");\n\ta.parse("This is another test.");\n\t\tRB.getString("This is a test", "y");');

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.get(ContextResourceString.hashKey("webapp", undefined, "en-US", "x", "python"));
        test.ok(r);
        test.equal(r.getSource(), "This is a test");
        test.ok(!r.getAutoKey());
        test.equal(r.getKey(), "x");

        r = set.get(ContextResourceString.hashKey("webapp", undefined, "en-US", "y", "python"));
        test.ok(r);
        test.equal(r.getSource(), "This is a test");
        test.ok(!r.getAutoKey());
        test.equal(r.getKey(), "y");

        test.done();
    },

    testPythonFileParseMultipleOnSameLine: function(test) {
        test.expect(8);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('RB.getString("This is a test");  a.parse("This is another test."); RB.getString("This is another test");\n');

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is a test");
        test.ok(r);
        test.equal(r.getSource(), "This is a test");
        test.ok(r.getAutoKey());

        r = set.getBySource("This is another test");
        test.ok(r);
        test.equal(r.getSource(), "This is another test");
        test.ok(r.getAutoKey());

        test.done();
    },

    testPythonFileParseMultipleWithComments: function(test) {
        test.expect(10);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('RB.getString("This is a test");   // i18n: foo\n\ta.parse("This is another test.");\n\t\tRB.getString("This is also a test");\t// i18n: bar');

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is a test");
        test.ok(r);
        test.equal(r.getSource(), "This is a test");
        test.equal(r.getKey(), "r654479252");
        test.equal(r.getComment(), "foo");

        r = set.getBySource("This is also a test");
        test.ok(r);
        test.equal(r.getSource(), "This is also a test");
        test.equal(r.getKey(), "r999080996");
        test.equal(r.getComment(), "bar");

        test.done();
    },

    testPythonFileParseMultipleWithUniqueIdsAndComments: function(test) {
        test.expect(10);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('RB.getString("This is a test", "asdf");   // i18n: foo\n\ta.parse("This is another test.");\n\t\tRB.getString("This is also a test", "kdkdkd");\t// i18n: bar');

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.get(ContextResourceString.hashKey("webapp", undefined, "en-US", "asdf", "python"));
        test.ok(r);
        test.equal(r.getSource(), "This is a test");
        test.equal(r.getKey(), "asdf");
        test.equal(r.getComment(), "foo");

        r = set.get(ContextResourceString.hashKey("webapp", undefined, "en-US", "kdkdkd", "python"));
        test.ok(r);
        test.equal(r.getSource(), "This is also a test");
        test.equal(r.getKey(), "kdkdkd");
        test.equal(r.getComment(), "bar");

        test.done();
    },

    testPythonFileParseWithDups: function(test) {
        test.expect(6);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('RB.getString("This is a test");\n\ta.parse("This is another test.");\n\t\tRB.getString("This is a test");');

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is a test");
        test.ok(r);
        test.equal(r.getSource(), "This is a test");
        test.equal(r.getKey(), "r654479252");

        test.equal(set.size(), 1);

        test.done();
    },

    testPythonFileParseDupsDifferingByKeyOnly: function(test) {
        test.expect(8);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('RB.getString("This is a test");\n\ta.parse("This is another test.");\n\t\tRB.getString("This is a test", "unique_id");');

        var set = pf.getTranslationSet();
        test.ok(set);

        var r = set.getBySource("This is a test");
        test.ok(r);
        test.equal(r.getSource(), "This is a test");
        test.equal(r.getKey(), "r654479252");

        r = set.get(ContextResourceString.hashKey("webapp", undefined, "en-US", "unique_id", "python"));
        test.ok(r);
        test.equal(r.getSource(), "This is a test");
        test.equal(r.getKey(), "unique_id");

        test.done();
    },

    testPythonFileParseBogusConcatenation: function(test) {
        test.expect(2);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('RB.getString("This is a test" + " and this isnt");');

        var set = pf.getTranslationSet();

        test.equal(set.size(), 0);

        test.done();
    },

    testPythonFileParseBogusConcatenation2: function(test) {
        test.expect(2);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('RB.getString("This is a test" + foobar);');

        var set = pf.getTranslationSet();
        test.equal(set.size(), 0);

        test.done();
    },

    testPythonFileParseBogusNonStringParam: function(test) {
        test.expect(2);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('RB.getString(foobar);');

        var set = pf.getTranslationSet();
        test.equal(set.size(), 0);

        test.done();
    },

    testPythonFileParseEmptyParams: function(test) {
        test.expect(2);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('RB.getString();');

        var set = pf.getTranslationSet();
        test.equal(set.size(), 0);

        test.done();
    },

    testPythonFileParseWholeWord: function(test) {
        test.expect(2);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('EPIRB.getString("This is a test");');

        var set = pf.getTranslationSet();
        test.equal(set.size(), 0);

        test.done();
    },

    testPythonFileParseSubobject: function(test) {
        test.expect(2);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        pf.parse('App.RB.getString("This is a test");');

        var set = pf.getTranslationSet();
        test.equal(set.size(), 1);

        test.done();
    },

    testPythonFileExtractFile: function(test) {
        test.expect(8);

        var pf = new PythonFile({
            project: p,
            pathName: "./python/t1.py",
            type: pft
        });
        test.ok(pf);

        // should read the file
        pf.extract();

        var set = pf.getTranslationSet();

        test.equal(set.size(), 2);

        var r = set.getBySource("This is a test");
        test.ok(r);
        test.equal(r.getSource(), "This is a test");
        test.equal(r.getKey(), "r654479252");

        var r = set.get(ContextResourceString.hashKey("webapp", undefined, "en-US", "id1", "python"));
        test.ok(r);
        test.equal(r.getSource(), "This is a test with a unique id");
        test.equal(r.getKey(), "id1");

        test.done();
    },

    testPythonFileExtractUndefinedFile: function(test) {
        test.expect(2);

        var pf = new PythonFile({
            project: p,
            pathName: undefined,
            type: pft
        });
        test.ok(pf);

        // should attempt to read the file and not fail
        pf.extract();

        var set = pf.getTranslationSet();

        test.equal(set.size(), 0);

        test.done();
    },

    testPythonFileExtractBogusFile: function(test) {
        test.expect(2);

        var pf = new PythonFile({
            project: p,
            pathName: "./python/foo.py",
            type: pft
        });
        test.ok(pf);

        // should attempt to read the file and not fail
        pf.extract();

        var set = pf.getTranslationSet();

        test.equal(set.size(), 0);

        test.done();
    },

    testPythonFileExtractFile2: function(test) {
        test.expect(11);

        var pf = new PythonFile({
            project: p,
            pathName: "./python/AskPickerSearchFragment.py",
            type: pft
        });
        test.ok(pf);

        // should read the file
        pf.extract();

        var set = pf.getTranslationSet();

        test.equal(set.size(), 3);

        var r = set.getBySource("Can't find a group?");
        test.ok(r);
        test.equal(r.getSource(), "Can't find a group?");
        test.equal(r.getKey(), "r315749545");

        r = set.getBySource("Can't find a friend?");
        test.ok(r);
        test.equal(r.getSource(), "Can't find a friend?");
        test.equal(r.getKey(), "r23431269");

        r = set.getBySource("Invite them to Myproduct");
        test.ok(r);
        test.equal(r.getSource(), "Invite them to Myproduct");
        test.equal(r.getKey(), "r245047512");

        test.done();
    }
    */
};
