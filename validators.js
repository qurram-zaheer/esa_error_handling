module.exports = {
  GENERAL: {
    paramsExist: ({ from, to, text }) => {
      if (!from || !to || !text) {
        return {
          message: "",
          error: `missing parameter(s):${from ? "" : " <from>"}${
            to ? "" : " <to>"
          }${text ? "" : " <text>"}`,
        };
      }
      return { error: "" };
    },
    paramValidation: ({ from, to, text }) => {
      let invalidParams = { from: false, to: false, text: false };
      if (!from.match(/^-{0,1}\d+$/) || from.length < 6 || from.length > 16) {
        invalidParams.from = true;
      }

      if (!to.match(/^-{0,1}\d+$/) || to.length < 6 || to.length > 16) {
        invalidParams.to = true;
      }

      if (text.length < 1 || text.length > 120) {
        invalidParams.text = true;
      }
      if (invalidParams.from || invalidParams.to || invalidParams.text) {
        return {
          message: "",
          error: `invalid parameter(s)${invalidParams.from ? " <from>" : ""}${
            invalidParams.to ? " <to>" : ""
          }${invalidParams.text ? " <text>" : ""}`,
        };
      }
      return { error: "" };
    },
  },
};
