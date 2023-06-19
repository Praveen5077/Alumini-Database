const messages = require("../../config/messages");
const bcrypt = require("bcryptjs");
const saltRounds = 10;
const ShopOwner = require("../../models/shopowner");
const Supplier = require("../../models/supplier");
const Products = require("../../models/products");
const SupplierProducts = require("../../models/supplierProducts");
const Otp = require("../../models/otp");

const fieldValidation = (req) => {
  const { supplier_id, products } = req.body;
  let error = "";
  if (supplier_id === "" || supplier_id === null || supplier_id === undefined) {
    error = new Error(messages.supplierIdNotFound);
  } else if (products.length <= 0) {
    error = new Error(messages.productIsEmpty);
  }
  if (error === "") {
    return true;
  } else {
    throw error;
  }
};

const addSupplierValidation = (req) => {
  const isEmpty = (value) =>
    value === undefined ||
    value === null ||
    value === "" ||
    (typeof value === "object" && Object.keys(value).length === 0);
  let error;
  const {
    company_name,
    mobile_number,
    prefered_language,
    user_name,
    password,
    address_1,
    city,
    state,
    country,
    zip,
  } = req.body;
  if (isEmpty(company_name)) {
    error = new Error(messages.companynameEmpty);
  } else if (isEmpty(mobile_number)) {
    error = new Error(messages.mobileNumber);
  } else if (isEmpty(prefered_language)) {
    error = new Error(messages.preferedLanguageAvailable);
  } else if (isEmpty(user_name)) {
    error = new Error(messages.userName);
  } else if (isEmpty(password)) {
    error = new Error(messages.password);
  } else if (isEmpty(address_1)) {
    error = new Error(messages.address);
  } else if (isEmpty(city)) {
    error = new Error(messages.city);
  } else if (isEmpty(state)) {
    error = new Error(messages.state);
  } else if (isEmpty(country)) {
    error = new Error(messages.country);
  } else if (isEmpty(zip)) {
    error = new Error(messages.zip);
  }
  if (error === undefined) {
    return "";
  } else {
    return error.message;
  }
};

const changePasswordValidation = (req) => {
  let error;
  const { password } = req.body;
  if (password === "" || password === null || password === undefined) {
    error = messages.password;
  }
  if (error === undefined) {
    return "";
  } else {
    return error;
  }
};

// @desc    Approve supplier
// @route   GET /api/v1/admin/supplier/allSuppliers
// @access  Private

exports.getAllSupplier = async (req, res, next) => {
  let { status, limit } = req.query;
  try {
    const allSuppliers = await Supplier.find(
      { approval_status: status },
      "-password -products"
    )
      .populate("country")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    if (allSuppliers.length <= 0) {
      res.status(200).json({
        success: false,
        data: [],
        message: messages.supplierIdNotFound,
      });
    } else {
      res.status(200).json({
        success: true,
        data: allSuppliers,
        message: messages.suppliersAvailable,
      });
    }
    res.status(200).json({
      success: true,
      data: allSuppliers,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    if (error.messageFormat === undefined) {
      res.status(500).json({ success: false, message: messages.errorWrong });
    }
    res.status(500).json({ success: false, message: messages.errorWrong });
    next(error);
  }
};

// @desc    Approve supplier
// @route   POST /api/v1/admin/supplier/createSupplier
// @access  Private

exports.createSupplier = async (req, res, next) => {
  try {
    const {
      name,
      company_name,
      mobile_number,
      landline_number_code,
      contact_person,
      contact_person_designation,
      about_us,
      telephone_number,
      email,
      profile_image_URL,
      user_name,
      password,
      address_1,
      address_2,
      city,
      state,
      zip,
      country,
      commission,
      approval_status,
      prefered_language,
      categories_products_brands,
    } = req.body;
    let validationError = addSupplierValidation(req);
    if (validationError !== "") {
      res.status(500).json({
        success: false,
        data: [],
        message: validationError,
      });
    } else if (mobile_number.length < 10) {
      res.status(500).json({
        success: false,
        data: [],
        message: messages.notValidMobilenumber,
      });
    } else {
      let userNamequery = { $or: [{ user_name: user_name }] };
      let companyNamequery = { $or: [{ company_name: company_name }] };
      let mobileNumberquery = { $or: [{ mobile_number: mobile_number }] };
      const supplierUserNameAvailable = await Supplier.find(userNamequery);
      const supplierCompanyAvailable = await Supplier.find(companyNamequery);
      const supplierMobileAvailable = await Supplier.find(mobileNumberquery);
      const shopOwnerMobileAvailable = await ShopOwner.find(mobileNumberquery);
      if (supplierUserNameAvailable.length > 0) {
        res.status(409).json({
          success: false,
          message: messages.userNameExists,
        });
      } else if (supplierCompanyAvailable.length > 0) {
        res.status(409).json({
          success: false,
          message: messages.companyNameExists,
        });
      } else if (
        shopOwnerMobileAvailable.length > 0 ||
        supplierMobileAvailable.length > 0
      ) {
        res.status(409).json({
          success: false,
          message: messages.mobileNumberExists,
        });
      } else {
        await bcrypt.hash(password, saltRounds, async function (err, hash) {
          if (err) {
            res.status(500).json({
              success: false,
              message: messages.passwordUpdateFailure,
            });
          } else {
            const supplierData = new Supplier({
              name: name,
              company_name: company_name,
              mobile_number: mobile_number,
              landline_number_code: landline_number_code,
              telephone_number: telephone_number,
              email: email,
              contact_person: contact_person,
              contact_person_designation: contact_person_designation,
              about_us: about_us,
              profile_image_URL: profile_image_URL,
              user_name: user_name,
              password: hash,
              address_1: address_1,
              address_2: address_2,
              city: city,
              state: state,
              zip: zip,
              country: country,
              commission: commission,
              approval_status: approval_status,
              prefered_language: prefered_language,
              categories_products_brands: categories_products_brands,
            });

            await supplierData.save(async function (errUnique) {
              let errorMsg = JSON.parse(JSON.stringify(errUnique));
              if (errorMsg == null) {
                //await Otp.find({ email: email }).deleteOne();
                res.status(200).json({
                  success: true,
                  data: supplierData,
                  message: messages.createSucess,
                });
              } else if (errorMsg._message == "supplier validation failed") {
                await res.status(500).json({
                  success: false,
                  message: errorMsg._message,
                });
              }
            });
          }
        });
      }
    }
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    if (error.messageFormat === undefined) {
      res.status(500).json({ success: false, message: messages.errorWrong });
    }
    res.status(500).json({ success: false, message: messages.errorWrong });
    next(error);
  }
};

//Get supplier product details
exports.getSupplierProductsDetails = async (req, res, next) => {
  const id = req.params.id;
  try {
    const suppProductDetails = await SupplierProducts.findOne({
      supplier_id: id,
    }).populate("supplier_id", "name");

    // console.log("suppProductDetails", suppProductDetails)
    let productArray = [];
    let findProduct = suppProductDetails.products.map(async (data) => {
      let productObj = await Products.findOne({ _id: data.product_id })
        .populate("brand", "brand_name")
        .populate("categories", "category_name");
      return productArray.push(productObj);
    });
    await Promise.all(findProduct);
    // console.log("productArray", productArray)
    suppProductDetails.products = productArray[0] === null ? [] : productArray;
    if (suppProductDetails === null) {
      return res.status(500).json({
        success: false,
        message: messages.supplierProductDetailsNotFound,
      });
    } else {
      return res.status(200).json({
        success: true,
        data: suppProductDetails,
      });
    }
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

//Create products for supplier
exports.createSupplierProducts = async (req, res, next) => {
  console.log("create supplier");
  const { supplier_id, products } = req.body;
  try {
    if (fieldValidation(req));
    const suppProduct = await SupplierProducts.findOne({
      supplier_id: supplier_id,
      status: true,
    });
    if (suppProduct === null) {
      const productData = new SupplierProducts({
        supplier_id: supplier_id,
        products: products,
        status: true,
      });
      await productData.save();
      res.status(200).json({
        success: true,
        data: productData,
        message: messages.createSucess,
      });
    } else {
      let productsArray = suppProduct.products;
      products.map((reqData) => {
        let uniqueArray = productsArray.find((dbData) => {
          return dbData.product_id === reqData.product_id;
        });
        if (uniqueArray === undefined) {
          productsArray.push(reqData);
        }
      });
      const updateResult = await SupplierProducts.updateOne(
        { supplier_id: supplier_id },
        {
          $set: {
            supplier_id: supplier_id,
            products: productsArray,
          },
        }
      );
      const updatedSupplierProducts = await SupplierProducts.findOne({
        supplier_id: supplier_id,
      }).populate("supplier_id", "name");
      res.status(200).json({
        success: true,
        data: updatedSupplierProducts,
        message: messages.updateSucess,
      });
    }
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    res.status(500).json({ success: false, message: messages.errorWrong });
    next(error);
  }
};

// @desc    Approve supplier
// @route   PUT /api/v1/admin/supplier/approveSupplier
// @access  Private

exports.approveSupplier = async (req, res, next) => {
  let { suppid, approveStatus } = req.query;
  try {
    const suppliers = await Supplier.findOne({ _id: suppid });
    if (suppliers === null) {
      return res
        .status(404)
        .json({ success: false, message: messages.supplierIdNotFound });
    } else if (
      approveStatus !== "pending" &&
      approveStatus !== "approved" &&
      approveStatus !== "disabled"
    ) {
      return res
        .status(404)
        .json({ success: false, message: messages.notValidStatus });
    } else suppliers.approval_status = approveStatus;
    let statusAction =
      approveStatus === "disabled" ? "Deactivated" : "Approved";
    suppliers.save();
    res.status(200).json({
      success: true,
      message: `The user ${suppliers.user_name} is successfully ${statusAction}`,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    if (error.messageFormat === undefined) {
      res.status(500).json({ success: false, message: messages.errorWrong });
    }
    res.status(500).json({ success: false, message: messages.errorWrong });
    next(error);
  }
};

exports.searchSupplier = async (req, res, next) => {
  const { user_name, company_name, mobile_number, approval_status } = req.query;

  const isEmpty = (value) =>
    value === undefined ||
    value === null ||
    (typeof value === "object" && Object.keys(value).length === 0) ||
    (typeof value === "string" && value.trim().length === 0);

  let queryText = [];

  if (!isEmpty(user_name)) {
    let q = {
      user_name: { $regex: user_name, $options: "i" },
    };
    queryText.push(q);
  }
  if (!isEmpty(company_name)) {
    let q = {
      company_name: {
        $elemMatch: {
          value: { $regex: company_name, $options: "i" },
        },
      },
    };
    queryText.push(q);
  }
  if (!isEmpty(mobile_number)) {
    let q = {
      mobile_number: mobile_number,
    };
    queryText.push(q);
  }
  if (!isEmpty(approval_status)) {
    let q = {
      approval_status: approval_status,
    };
    queryText.push(q);
  }

  try {
    let data = {};

    let query;
    if (queryText.length > 0) {
      query = queryText;
    } else {
      // query = {
      //   categoryValue: filterCategoryValue
      // }
    }

    const functionWithPromise = async (item) => {
      return item;
    };

    const finalResult = async () => {
      let dataResult = "";
      if (queryText.length > 0) {
        dataResult = await Supplier.find({ $and: query });
      } else {
        dataResult = await Supplier.find({});
      }
      return Promise.all(dataResult.map((item) => functionWithPromise(item)));
    };

    finalResult().then((dd) => {
      data["success"] = true;
      data["data"] = dd;
      res.status(201).json(data);
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// @desc    View supplier
// @route   GET /api/v1/admin/supplier/viewSupplier
// @access  Private

exports.viewSupplier = async (req, res, next) => {
  let { supplierId } = req.query;
  try {
    const supplierData = await Supplier.findById(supplierId, "-password")
      .populate("country")
      .exec((err, docs) => {
        if (err) {
          res.status(404).json({
            success: false,
            message: messages.invalidUser,
          });
        } else if (docs !== null) {
          res.status(200).json({
            success: true,
            data: docs,
            message: messages.suppliersAvailable,
          });
        } else {
          res.status(404).json({
            success: false,
            message: messages.supplierIdNotFound,
          });
        }
      });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    if (error.messageFormat === undefined) {
      res.status(500).json({ success: false, message: messages.errorWrong });
    }
    res.status(500).json({ success: false, message: messages.errorWrong });
    next(error);
  }
};

// @desc    Edit supplier
// @route   PUT /api/v1/admin/supplier/updateSupplier
// @access  Private

exports.updateSupplier = async (req, res, next) => {
  let { supplierId } = req.query;
  try {
    let validationError = addSupplierValidation(req);
    if (validationError !== messages.password && validationError !== "") {
      res.status(200).json({
        success: false,
        message: validationError,
      });
    } else {
      if (req.body.mobile_number.length < 10) {
        res.status(200).json({
          success: false,
          message: messages.notValidMobilenumber,
        });
      } else {
        let userNamequery = {};
        let companyNamequery = {};
        let mobileNumberquery = {};
        userNamequery = {
          _id: { $ne: supplierId },
          $or: [{ user_name: req.body.user_name }],
        };
        companyNamequery = {
          _id: { $ne: supplierId },
          $or: [{ company_name: req.body.company_name }],
        };
        mobileNumberquery = {
          _id: { $ne: supplierId },
          $or: [{ mobile_number: req.body.mobile_number }],
        };
        const supplierUserNameAvailable = await Supplier.find(userNamequery);
        const supplierCompanyAvailable = await Supplier.find(companyNamequery);
        const supplierMobileAvailable = await Supplier.find(mobileNumberquery);
        const shopOwnerMobileAvailable = await ShopOwner.find(
          mobileNumberquery
        );
        if (supplierUserNameAvailable.length > 0) {
          res.status(409).json({
            success: false,
            message: messages.userNameExists,
          });
        } else if (supplierCompanyAvailable.length > 0) {
          res.status(409).json({
            success: false,
            message: messages.companyNameExists,
          });
        } else if (
          shopOwnerMobileAvailable.length > 0 ||
          supplierMobileAvailable.length > 0
        ) {
          res.status(409).json({
            success: false,
            message: messages.mobileNumberExists,
          });
        } else {
          Supplier.findOneAndUpdate(
            { _id: supplierId },
            {
              approval_status: req.body.approval_status,
              name: req.body.name,
              company_name: req.body.company_name,
              mobile_number: req.body.mobile_number,
              landline_number_code: req.body.landline_number_code,
              telephone_number: req.body.telephone_number,
              email: req.body.email,
              contact_person: req.body.contact_person,
              contact_person_designation: req.body.contact_person_designation,
              about_us: req.body.about_us,
              profile_image_URL: req.body.profile_image_URL,
              user_name: req.body.user_name,
              address_1: req.body.address_1,
              address_2: req.body.address_2,
              city: req.body.city,
              state: req.body.state,
              zip: req.body.zip,
              country: req.body.country,
              commission: req.body.commission,
              prefered_language: req.body.prefered_language,
              categories_products_brands: req.body.categories_products_brands,
            },
            { new: true },
            function (err, docs) {
              if (err) {
                res.status(404).json({
                  success: false,
                  message: messages.invalidUser,
                });
              } else {
                if (docs === null) {
                  res.status(404).json({
                    success: false,
                    message: messages.supplierIdNotFound,
                  });
                } else {
                  res.status(200).json({
                    success: true,
                    message: messages.updateProfileSuccess,
                  });
                }
              }
            }
          );
        }
      }
    }
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    if (error.messageFormat === undefined) {
      res.status(500).json({ success: false, message: messages.errorWrong });
    }
    res.status(500).json({ success: false, message: messages.errorWrong });
    next(error);
  }
};

// @desc    Change supplier profile password
// @route   PUT /api/v1/admin/supplier/changePassword
// @access  Private

exports.changeSupplierPassword = async (req, res, next) => {
  let { supplierId } = req.query;
  try {
    let validationError = changePasswordValidation(req);
    if (validationError !== "") {
      res.status(200).json({
        success: false,
        message: validationError,
      });
    } else {
      bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        if (err) {
          res.status(500).json({
            success: false,
            message: messages.passwordUpdateFailure,
          });
        } else {
          Supplier.findOneAndUpdate(
            { _id: supplierId },
            { password: hash },
            { new: true },
            function (err, docs) {
              if (err) {
                res.status(404).json({
                  success: false,
                  message: messages.invalidUser,
                });
              } else {
                if (docs === null) {
                  res.status(404).json({
                    success: false,
                    message: messages.supplierIdNotFound,
                  });
                } else {
                  res.status(200).json({
                    success: true,
                    message: messages.updateProfileSuccess,
                  });
                }
              }
            }
          );
        }
      });
    }
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    if (error.messageFormat === undefined) {
      res.status(500).json({ success: false, message: messages.errorWrong });
    }
    res.status(500).json({ success: false, message: messages.errorWrong });
    next(error);
  }
};
