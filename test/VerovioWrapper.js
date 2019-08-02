const verovio = require('verovio-dev');

/**
 * Wrapper to be used during tests when Web Workers are not available.
 */
export default class VerovioWrapper {
  constructor () {
    this.toolkit = new verovio.toolkit();
    this.toolkit.setOptions({
      format: 'mei',
      noFooter: 1,
      noHeader: 1,
      pageMarginLeft: 0,
      pageMarginTop: 0,
      font: 'Bravura',
      useFacsimile: true,
      createDefaultSyl: true,
      createDefaultSylBBox: true,
      useSkew: true
    });
  }

  /**
   * Fake adding an event handler, just save the handler.
   * @param {string} type - The event to listen to, which is ignored.
   * @param {function} handler - The handler that will be saved.
   */
  addEventListener (type, handler) {
    this.handler = handler;
  }

  /**
   * Fake sending a message and call the handler with the message here.
   * @param {object} message
   */
  postMessage (message) {
    let data = this.handleNeonEvent(message);
    let evt = {
      data: data,
      target: {
        removeEventListener: () => {}
      }
    };

    this.handler(evt);
  }

  /**
   * Handler for the different messages that could be sent.
   * @param {object} data - The content of the message.
   * @returns {object}
   */
  handleNeonEvent (data) {
    let result = {
      id: data.id
    };

    switch (data.action) {
      case 'renderData':
        result.svg = this.toolkit.renderData(data.mei, {});
        break;
      case 'getElementAttr':
        result.attributes = this.toolkit.getElementAttr(data.elementId);
        break;
      case 'edit':
        result.result = this.toolkit.edit(data.editorAction);
        break;
      case 'getMEI':
        result.mei = this.toolkit.getMEI(0, true);
        break;
      case 'editInfo':
        result.info = this.toolkit.editInfo();
        break;
      case 'renderToSVG':
        result.svg = this.toolkit.renderToSVG(1);
        break;
      default:
        break;
    }

    return result;
  }
}
