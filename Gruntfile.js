module.exports = function(grunt) {
    var BUILD_PATH = "dist/";
    var SRC_PATH = "src/sgd_visualization.jsx";
    
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        browserify: {
            dev: {
                dest: "examples/locus_diagram/js/bundled_locus_diagram.js",
                src: "src/bundled.jsx",
                options: {
                    bundleOptions: {
                        debug: true
                    }
                }
            },
            build: {
                dest: BUILD_PATH + "sgd_visualization.js",
                src: SRC_PATH,
                options: {
                    bundleOptions: {
                        debug: false
                    }
                }
            }
        },

        watch: {
            options: {
                livereload: true
            },
            jsx: {
                files: ["src/**/*.jsx"],
                tasks: ["browserify:dev"]
            }
        },

    });

    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-browserify");
    
    grunt.registerTask("build", ["browserify:build"]);
    grunt.registerTask("default", ["browserify:dev", "watch"]);
};
