/*
 * testPythonFileType.js - test the Python file type handler object.
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

if (!PythonFileType) {
    var PythonFileType = require("../PythonFileType.js");
    var CustomProject =  require("loctool/lib/CustomProject.js");
}

var p = new CustomProject({
    id: "webapp",
    name: "webapp",
    sourceLocale: "en-US"
}, "./test/testfiles", {
    locales:["en-GB"]
});


module.exports.pyfiletype = {
    testPythonFileTypeConstructor: function(test) {
        test.expect(1);

        var htf = new PythonFileType(p);

        test.ok(htf);

        test.done();
    },

    testPythonFileTypeHandlesPythonTrue: function(test) {
        test.expect(2);

        var htf = new PythonFileType(p);
        test.ok(htf);

        test.ok(htf.handles("foo.py"));

        test.done();
    },

    testPythonFileTypeHandlesPythonFalseClose: function(test) {
        test.expect(2);

        var htf = new PythonFileType(p);
        test.ok(htf);

        test.ok(!htf.handles("foopy"));

        test.done();
    },

    testPythonFileTypeHandlesFalse: function(test) {
        test.expect(2);

        var htf = new PythonFileType(p);
        test.ok(htf);

        test.ok(!htf.handles("foo.html"));

        test.done();
    },

    testPythonFileTypeHandlesPythonTrueWithDir: function(test) {
        test.expect(2);

        var htf = new PythonFileType(p);
        test.ok(htf);

        test.ok(htf.handles("a/b/c/foo.py"));

        test.done();
    }
};
