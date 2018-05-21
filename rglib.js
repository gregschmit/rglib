// rglib: a library for decoding and verification of RGNets part numbers
//        and licenses.
// Copyright 2018, Gregory N. Schmit
// MIT Licensed

var rglib = (function() {

  function decode_iui(iui) {
    /*
     * Try to decode an IUI into ts components parts. If valid, return an
     * object with the components and `valid=true`. If not valid, then return
     * an object with a single property `valid=false`.
     */

    /* split into components */
    var parts = iui.replace(/^\s+|\s+$/).split(/\s+/);

    /* check that we have at least 5 components */
    if (parts.length < 5) {
      return { valid: false, reason: "not enough parts" };
    }

    /* try to pull out first 4 integer components */
    var cores = Number(parts[0]);
    var speed = Number(parts[1]);
    var ram = Number(parts[2]);
    var disk = Number(parts[3]);
    if (!(Number.isInteger(cores)
      && Number.isInteger(speed)
      && Number.isInteger(ram)
      && Number.isInteger(disk))) {
      return { valid: false, reason: "first 4 not integers" };
    }

    /* now try to get macs, check multiple of 12 and uppercase alphas */
    parts = parts.slice(4);
    var macs = parts.join("");
    if (macs.length % 12 != 0) {
      return { valid: false, reason: "macs length not multiple of 12" };
    }
    var upper_alphas = String(Array(27)).split('').map(function(n,i) {
      return String.fromCharCode(i+65);
    }).join('');
    var i;
    for (i=0; i<macs.length; i++) {
      if (upper_alphas.indexOf(macs[i]) === -1) {
        return { valid: false, reason: "macs not upper alphas" };
      }
    }

    /* separate macs properly */
    i = 24;
    while (i < macs.length) {
      macs = macs.slice(0, i) + " " + macs.slice(i);
      i += 25;
    }
    
    /* build cleaned iui */
    iui = [cores.toString, speed.toString, ram.toString, disk.toString, macs];
    iui = iui.join(' ');

    return {
      cores: cores,
      speed: speed,
      ram: ram,
      disk: disk,
      macs: macs,
      iui: iui,
      valid: true };
  }

  function is_valid_iui(iui) {
    /*
     * Validate the iui by decoding it and checking the valid property of the
     * returned object. Returns `true` or `false` (the valid property.
     */
    return decode_iui(iui).valid;
  }

  function clean_iui(iui) {
    /*
     * Clean the IUI by decoding it and checking the `valid` property. Returns
     * the iui if valid, otherwise returns ''.
     */
    var decoded = decode_iui(iui);
    if (decoded.valid) {
      return decoded.iui;
    }
    return '';
  }

  function decode_iui_list(iui_list, separator) {
    /*
     * Decode a list of IUIs, return an object that has a top-level `valid`
     * property, along with a list of the decoded iuis as an `iuis` property.
     */
    if (!separator) { separator = ','; }
    var iuis = iui_list.split(separator);
    var iui;
    var ret = { valid: true, iuis: [] };
    iuis.forEach(function(x) {
      iui = decode_iui(x);
      if (!iui.valid) { ret.valid = false; return; }
      ret.iuis.push(iui);
    });
    return ret;
  }

  function has_no_iui(iui_list, separator) {
    var iuis = decode_iui_list(iui_list, separator);
    var found = false;
    var iui;
    iuis.iuis.forEach(function(x) {
      if (x.valid) { found = true; }
    });
    return found;
  }

  function expected_nodes(product, sul) {
    /*
     * Return how many nodes (cc + gateways) a product *should* have.
     */
    if (product.search(/V[0-9]/) != -1 || product.search(/[SA]6/) != -1) {
      return Math.floor(sul / 1000) + 1;
    }
    return 1; 
  }

  function support_part_number(product) {
    if (product.indexOf('Demo') != -1) {
      return '';
    }
    var tk = ['CC4', 'A4', 'RS4', 'S4', 'A6', 'RS6', 'S6'];
    var i;
    for (i=0; i<tk.length; i++) {
      if (product.indexOf('2' + tk[i]) != -1) {
        return 'RXG 2' + tk[i] + ' ECOSA';
      }
      if (product.indexOf(tk[i]) != -1) {
        return 'RXG ' + tk[i] + ' EOSA';
      }
    }
    var vc = ['V24', 'V16', 'V8', 'V4', 'CC4'];
    for (i=0; i<vc.length; i++) {
      if (product.indexOf(vc[i]) != -1) {
        return 'RXG ' + vc[i] + ' SWOSA';
      }
    }
    if (product.indexOf('V Series') != -1) {
      return 'RXG VS SWOSA';
    }
    var sw = ['A', 'RS', 'S'];
    for (i=0; i<sw.length; i++) {
      if (product.indexOf(sw[i] + ' Series') != -1) {
        return 'RXG ' + sw[i] + ' SWOSA';
      }
    }
    if (product.indexOf('CC Series') != -1) {
      return 'RXG CC4 SWOSA';
    }
    return '';
  }

  return {
    decode_iui: decode_iui,
    is_valid_iui: is_valid_iui,
    clean_iui: clean_iui,
    decode_iui_list: decode_iui_list
  };
}());

// node exports
if (typeof(module) == "object") {
  module.exports = exports = rglib;
}
