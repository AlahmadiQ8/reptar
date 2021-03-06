import glob from 'glob';
import path from 'path';
import fs from 'fs-extra';
import resolve from 'resolve';
import _ from 'lodash';
import {getReptarPackageNames} from '../json';
import Parse from '../parse';
import * as CONSTANTS from '../constants';
import Asset from './asset';

/**
 * Find all theme.yml files in node_modules.
 * @param {string} directory Directory to load package.json from.
 * @return {Array.<string>} Array of paths to theme.yml files.
 */
function getThemesFromPackageJson(directory = '') {
  const reptarThemePackageNameRegex = /^reptar\-theme\-/;

  // All packages that exist in our root package.json file.
  const reptarPackages = getReptarPackageNames(directory);

  // Return only the path to the theme.yml file.
  return reptarPackages.reduce((packageThemes, packageName) => {
    if (!reptarThemePackageNameRegex.test(packageName)) {
      return packageThemes;
    }

    // Use module's main field which should reference the config yaml file.
    const yamlPath = resolve.sync(packageName, {
      basedir: directory
    });

    packageThemes.push(yamlPath);

    return packageThemes;
  }, []);
}

export default class Theme {
  constructor() {
    /**
     * The current theme name.
     * @type {string}
     */
    this.name = '';

    /**
     * Raw object that holds the theme config object.
     * @type {Object}
     */
    this.config;

    /**
     * Collection of all assets for this theme.
     * @type {Object.<string, Asset>}
     */
    this.assets = Object.create(null);

    /**
     * Data of asset names and paths that is exposed to templates.
     * @type {Object}
     */
    this.data = Object.create(null);
  }

  /**
   * Set global config delegate function.
   * @param {Object} getConfig Config object.
   */
  setGetConfig(getConfig) {
    this._getConfig = getConfig;
  }

  update() {
    this.name = this._getConfig().get('theme');

    const configPath = this._getConfig().get('path');

    // Find all theme config files that might exist.
    const fileSystemYamls = glob.sync(
      configPath.themes + `/**/${CONSTANTS.YAML.THEME}`,
      { nodir: true }
    );

    const moduleYamls = getThemesFromPackageJson(configPath.source);

    const allYamls = [].concat(fileSystemYamls, moduleYamls);

    const files = allYamls.reduce((allFiles, file) => {
      let parsedFile;
      try {
        parsedFile = Parse.fromYaml(
          fs.readFileSync(file, 'utf8')
        );
      } catch (e) {
        return allFiles;
      }

      // If the found theme config file name matches our set theme name
      // then save it.
      if (parsedFile.name === this.name) {
        // Save the directory where the correct theme file was found.
        parsedFile.path[CONSTANTS.KEY.SOURCE] = path.dirname(file);
        allFiles.push(parsedFile);
      }

      return allFiles;
    }, []);

    if (files.length === 0) {
      throw new Error(`Did not find any theme named '${this.name}' installed.`);
    } else if (files.length !== 1) {
      throw new Error('Found multiple themes with the same name: ' +
        files.join(','));
    }

    const parsedFile = files[0];

    // Save raw theme config.
    this.config = parsedFile;

    // Calculate absolute path of 'paths' keys.
    _.each(this.config.path, (val, key) => {
      if (key !== CONSTANTS.KEY.SOURCE) {
        // The root of the theme's destination is the site's destination.
        const rootPath = key === CONSTANTS.KEY.DESTINATION ?
          configPath.destination : this.config.path.source;

        const keyValue = this.config.path[key];

        // Support converting array of values to their absolute path.
        if (_.isArray(keyValue)) {
          this.config.path[key] = keyValue.map(value => {
            return path.resolve(
              rootPath,
              value
            );
          });
        } else {
          this.config.path[key] = path.resolve(rootPath, keyValue);
        }
      }
    });

    this._createAssets();
  }

  _createAssets() {
    // Instantiate an Asset for every asset the theme configures.
    this.assets = _.reduce(
      this.config.assets,
      (assets, assetConfig, assetType) => {
        assetConfig.destination = path.resolve(
          this.config.path.destination,
          assetConfig.source
        );

        assetConfig.source = path.resolve(
          this.config.path.source,
          assetConfig.source
        );

        const asset = new Asset(assetType, assetConfig);
        assets[asset.id] = asset;
        return assets;
      },
      Object.create(null)
    );
  }

  async read() {
    const pathDestination = this._getConfig().get('path.destination');

    // Have every asset write itself to the destination folder.
    await Promise.all(
      _.map(this.assets, asset => {
        return asset.process(pathDestination);
      })
    );

    // Expose every asset's data onto the theme's data object.
    _.each(this.assets, asset => {
      if (asset.data) {
        this.data[asset.type] = asset.data.url;
      }
    });
  }

  async write() {
    // Have every asset write itself to the destination folder.
    await Promise.all(
      _.map(this.assets, asset => {
        return asset.write();
      })
    );
  }
}
