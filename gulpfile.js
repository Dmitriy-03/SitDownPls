import gulp from "gulp";
const { src, dest, series, watch } = gulp;
import { deleteAsync } from "del";
import concat from "gulp-concat";
import htmlMin from "gulp-htmlmin";
import autoprefixer from "gulp-autoprefixer";
import cleanCSS from "gulp-clean-css";
import gulpSass from "gulp-sass";
import * as dartSass from "sass";
const sass = gulpSass(dartSass);
import svgSprite from "gulp-svg-sprite";
import image from "gulp-image";
import uglify from "gulp-uglify-es";
const uglifyDef = uglify.default;
import babel from "gulp-babel";
import notify from "gulp-notify";
import sourcemaps from "gulp-sourcemaps";
import webp from "gulp-webp";
import favicon from "gulp-favicons";
import filter from "gulp-filter";
import browserSync from "browser-sync";
browserSync.create();
import gulpIf from "gulp-if";

let prod = false;

const isProd = (done) => {
  prod = true;
  done();
};

const clean = async () => {
  await deleteAsync(["dist"]);
};

const htmlMinify = () => {
  return src("src/**/*.html")
    .pipe(
      gulpIf(
        prod,
        htmlMin({
          collapseWhitespace: true,
        })
      )
    )
    .pipe(dest("dist"))
    .pipe(browserSync.stream());
};

const styles = () => {
  return src(["src/scss/**/*.scss", "src/styles/*.css"])
    .pipe(gulpIf(!prod, sourcemaps.init()))
    .pipe(sass().on("error", sass.logError))
    .pipe(
      autoprefixer({
        cascade: false,
      })
    )
    .pipe(
      cleanCSS({
        format: gulpIf(!prod, "beautify"),
        level: 2,
      })
    )
    .pipe(gulpIf(!prod, sourcemaps.write()))
    .pipe(dest("dist/css"))
    .pipe(browserSync.stream());
};

const svgSprites = () => {
  return src("src/images/svg/**/*.svg")
    .pipe(image())
    .pipe(
      svgSprite({
        mode: {
          stack: {
            sprite: "../sprite.svg",
          },
        },
      })
    )
    .pipe(dest("dist/img"));
};

const images = () => {
  return src([
    "src/images/**/*.jpg",
    "src/images/**/*.png",
    "src/images/**/*.jpeg",
  ])
    .pipe(webp())
    .pipe(dest("dist/img"));
};

const scripts = () => {
  return src("src/js/**/*.js")
    .pipe(gulpIf(!prod, sourcemaps.init()))
    .pipe(
      babel({
        presets: ["@babel/env"],
      })
    )
    .pipe(concat("app.js"))
    .pipe(gulpIf(prod, uglifyDef()).on("error", notify.onError()))
    .pipe(gulpIf(!prod, sourcemaps.write(".")))
    .pipe(dest("dist/js"))
    .pipe(browserSync.stream());
};

const resources = () => {
  return src("src/resources/**").pipe(dest("dist"));
};

const watchFiles = () => {
  browserSync.init({
    server: {
      baseDir: "dist",
    },
  });

  watch("src/**/*.html", htmlMinify);
  watch(["src/scss/**/*.scss", "src/styles/**/*.css"], styles);
  watch("src/images/svg/**/*.svg", svgSprites);
  watch("src/images/**/*.{jpg,jpeg,png}", images);
  watch("src/js/**/*.js", scripts);
  watch("src/resources/**", resources);
};

const svgResize = () => {
  return src("src/images/*.svg").pipe(image()).pipe(dest("dist/img"));
};

const fonts = () => {
  return src(["src/fonts/*.woff", "src/fonts/*.woff2"]).pipe(
    dest("dist/fonts")
  );
};

const createFavicon = () => {
  return src("src/images/favicon.svg", { allowEmpty: true })
    .pipe(
      favicon({
        icons: {
          favicons: true,
          android: false,
          appleIcon: false,
          appleStartup: false,
          windows: false,
          yandex: false,
        },
      })
    )
    .pipe(filter("favicon.ico"))
    .pipe(dest("dist"));
};

export const dev = series(
  clean,
  htmlMinify,
  styles,
  scripts,
  images,
  svgSprites,
  svgResize,
  resources,
  fonts,
  createFavicon,
  watchFiles
);

export const build = series(
  isProd,
  clean,
  htmlMinify,
  styles,
  scripts,
  images,
  svgSprites,
  svgResize,
  resources,
  fonts,
  createFavicon
);
