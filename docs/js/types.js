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
    this.color = "";
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
    this.accountingMonth = dateParts[2] + "-" + dateParts[0];
    this.transactionMonth = dateParts[0];
    this.transactionDay = dateParts[1];
    this.transactionYear = dateParts[2];
    this.transactionTypeId = 2;
    this.paymentMethod = null;
    this.amount = 0.0;
    this.primaryCategoryId = null;
    this.subCategoryIds = null;
    this.memo = null;
}