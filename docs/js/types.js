function Enums()
{
}
Enums.transactionType = [
    {type: "transactionType", name: "Credit", value: 1},
    {type: "transactionType", name: "Expense", value: 2}
];
Enums.labelType = [
    {type: "labelType", name: "PrimaryCategory", value: 1},
    {type: "labelType", name: "SubCategory", value: 2},
    {type: "labelType", name: "PaymentCategory", value: 3}
];
Enums.budgetLimitType = [
    {type: "budgetLimitType", name: "None", value: 1},
    {type: "budgetLimitType", name: "Min", value: 2},
    {type: "budgetLimitType", name: "Equal", value: 3},
    {type: "budgetLimitType", name: "Max", value: 4}
];
Enums.budgetTrackingType = [
    {type: "budgetTrackingType", name: "None", value: 1},
    {type: "budgetTrackingType", name: "Change", value: 1},
    {type: "budgetTrackingType", name: "Increase", value: 1},
    {type: "budgetTrackingType", name: "Decrease", value: 1}
];
Enums.importSettingType = [
    {type: "importSettingType", name: "Category", value: 1},
    {type: "importSettingType", name: "SubCategory", value: 2},
    {type: "importSettingType", name: "PaymentMethod", value: 3},
    {type: "importSettingType", name: "TransactionDate", value: 4},
    {type: "importSettingType", name: "TransactionType", value: 5},
    {type: "importSettingType", name: "Amount", value: 6},
    {type: "importSettingType", name: "Memo", value: 7},
]
function Setting() {
    this.id = 0;
    this.createDate = new Date().toISOString();
    this.updateDate = new Date().toISOString();
    this.isActive = true;
    this.name = null;
    this.value = null;
}

function Label() {
    this.id = 0;
    this.createDate = new Date().toISOString();
    this.updateDate = new Date().toISOString();
    this.isActive = true;
    this.name = "";
    this.color = "#000000";
    this.paymentMethod = true;
    this.primaryCategory = true;
    this.subCategory = true;
}

function Transaction() {
    const dateParts = new Date().toLocaleDateString().split("/");
    this.id = 0;
    this.createDate = new Date().toISOString();
    this.updateDate = new Date().toISOString();
    this.isActive = true;
    this.transactionDate = new Date().toISOString();
    this.accountingMonth = null;
    this.transactionMonth = null;
    this.transactionDay = null;
    this.transactionDayOfTheWeek = null;
    this.transactionYear = null;
    this.transactionTypeId = 2;
    this.paymentMethodId = null;
    this.amount = 0.0;
    this.primaryCategoryId = null;
    this.subCategoryIds = null;
    this.memo = null;
}