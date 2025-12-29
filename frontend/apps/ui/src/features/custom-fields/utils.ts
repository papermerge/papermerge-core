import {ComboboxItem} from "@mantine/core"
import {TFunction} from "i18next"

export function getCustomFieldTypes(t?: TFunction): ComboboxItem[] {
  const data: ComboboxItem[] = [
    {
      value: "date",
      label: t?.("customFieldType.date.label", {defaultValue: "Date"}) || "Date"
    },
    {
      value: "text",
      label:
        t?.("customFieldType.text", {defaultValue: "Long Text"}) || "Long Text"
    },
    {
      value: "short_text",
      label:
        t?.("customFieldType.short_text", {defaultValue: "Short Text"}) ||
        "Short Text"
    },
    {
      value: "boolean",
      label:
        t?.("customFieldType.boolean", {defaultValue: "Yes/No"}) || "Yes/No"
    },
    {
      value: "int",
      label: t?.("customFieldType.int", {defaultValue: "Integer"}) || "Integer"
    },
    {
      value: "float",
      label:
        t?.("customFieldType.float", {defaultValue: "Decimal"}) || "Decimal"
    },
    {
      value: "monetary",
      label:
        t?.("customFieldType.monetary", {defaultValue: "Currency"}) ||
        "Currency"
    },
    {
      value: "yearmonth",
      label:
        t?.("customFieldType.yearmonth", {defaultValue: "Year/Month"}) ||
        "Year/Month"
    },
    {
      value: "select",
      label:
        t?.("customFieldTypes.select", {defaultValue: "Select"}) || "Select"
    },
    {
      value: "multiselect",
      label:
        t?.("customFieldTypes.multiselect", {defaultValue: "Multi-Select"}) ||
        "Multi-Select"
    }
  ]

  return data
}

export function getCurrencies(t?: TFunction): ComboboxItem[] {
  const data: ComboboxItem[] = [
    // Europe - All currencies
    {
      value: "ALL",
      label:
        t?.("currency.all", {defaultValue: "ALL - Albanian Lek"}) ||
        "ALL - Albanian Lek"
    },
    {
      value: "AMD",
      label:
        t?.("currency.amd", {defaultValue: "AMD - Armenian Dram"}) ||
        "AMD - Armenian Dram"
    },
    {
      value: "AZN",
      label:
        t?.("currency.azn", {defaultValue: "AZN - Azerbaijani Manat"}) ||
        "AZN - Azerbaijani Manat"
    },
    {
      value: "BAM",
      label:
        t?.("currency.bam", {defaultValue: "BAM - Bosnia-Herzegovina Mark"}) ||
        "BAM - Bosnia-Herzegovina Mark"
    },
    {
      value: "BGN",
      label:
        t?.("currency.bgn", {defaultValue: "BGN - Bulgarian Lev"}) ||
        "BGN - Bulgarian Lev"
    },
    {
      value: "BYN",
      label:
        t?.("currency.byn", {defaultValue: "BYN - Belarusian Ruble"}) ||
        "BYN - Belarusian Ruble"
    },
    {
      value: "CHF",
      label:
        t?.("currency.chf", {defaultValue: "CHF - Swiss Franc"}) ||
        "CHF - Swiss Franc"
    },
    {
      value: "CZK",
      label:
        t?.("currency.czk", {defaultValue: "CZK - Czech Koruna"}) ||
        "CZK - Czech Koruna"
    },
    {
      value: "DKK",
      label:
        t?.("currency.dkk", {defaultValue: "DKK - Danish Krone"}) ||
        "DKK - Danish Krone"
    },
    {
      value: "EUR",
      label: t?.("currency.eur", {defaultValue: "EUR - Euro"}) || "EUR - Euro"
    },
    {
      value: "GBP",
      label:
        t?.("currency.gbp", {defaultValue: "GBP - British Pound"}) ||
        "GBP - British Pound"
    },
    {
      value: "GEL",
      label:
        t?.("currency.gel", {defaultValue: "GEL - Georgian Lari"}) ||
        "GEL - Georgian Lari"
    },
    {
      value: "HUF",
      label:
        t?.("currency.huf", {defaultValue: "HUF - Hungarian Forint"}) ||
        "HUF - Hungarian Forint"
    },
    {
      value: "ISK",
      label:
        t?.("currency.isk", {defaultValue: "ISK - Icelandic Króna"}) ||
        "ISK - Icelandic Króna"
    },
    {
      value: "MDL",
      label:
        t?.("currency.mdl", {defaultValue: "MDL - Moldovan Leu"}) ||
        "MDL - Moldovan Leu"
    },
    {
      value: "MKD",
      label:
        t?.("currency.mkd", {defaultValue: "MKD - Macedonian Denar"}) ||
        "MKD - Macedonian Denar"
    },
    {
      value: "NOK",
      label:
        t?.("currency.nok", {defaultValue: "NOK - Norwegian Krone"}) ||
        "NOK - Norwegian Krone"
    },
    {
      value: "PLN",
      label:
        t?.("currency.pln", {defaultValue: "PLN - Polish Złoty"}) ||
        "PLN - Polish Złoty"
    },
    {
      value: "RON",
      label:
        t?.("currency.ron", {defaultValue: "RON - Romanian Leu"}) ||
        "RON - Romanian Leu"
    },
    {
      value: "RSD",
      label:
        t?.("currency.rsd", {defaultValue: "RSD - Serbian Dinar"}) ||
        "RSD - Serbian Dinar"
    },
    {
      value: "RUB",
      label:
        t?.("currency.rub", {defaultValue: "RUB - Russian Ruble"}) ||
        "RUB - Russian Ruble"
    },
    {
      value: "SEK",
      label:
        t?.("currency.sek", {defaultValue: "SEK - Swedish Krona"}) ||
        "SEK - Swedish Krona"
    },
    {
      value: "TRY",
      label:
        t?.("currency.try", {defaultValue: "TRY - Turkish Lira"}) ||
        "TRY - Turkish Lira"
    },
    {
      value: "UAH",
      label:
        t?.("currency.uah", {defaultValue: "UAH - Ukrainian Hryvnia"}) ||
        "UAH - Ukrainian Hryvnia"
    },

    // Americas - Major currencies
    {
      value: "ARS",
      label:
        t?.("currency.ars", {defaultValue: "ARS - Argentine Peso"}) ||
        "ARS - Argentine Peso"
    },
    {
      value: "BRL",
      label:
        t?.("currency.brl", {defaultValue: "BRL - Brazilian Real"}) ||
        "BRL - Brazilian Real"
    },
    {
      value: "CAD",
      label:
        t?.("currency.cad", {defaultValue: "CAD - Canadian Dollar"}) ||
        "CAD - Canadian Dollar"
    },
    {
      value: "CLP",
      label:
        t?.("currency.clp", {defaultValue: "CLP - Chilean Peso"}) ||
        "CLP - Chilean Peso"
    },
    {
      value: "COP",
      label:
        t?.("currency.cop", {defaultValue: "COP - Colombian Peso"}) ||
        "COP - Colombian Peso"
    },
    {
      value: "MXN",
      label:
        t?.("currency.mxn", {defaultValue: "MXN - Mexican Peso"}) ||
        "MXN - Mexican Peso"
    },
    {
      value: "USD",
      label:
        t?.("currency.usd", {defaultValue: "USD - US Dollar"}) ||
        "USD - US Dollar"
    },

    // Asia - Major currencies
    {
      value: "AED",
      label:
        t?.("currency.aed", {defaultValue: "AED - UAE Dirham"}) ||
        "AED - UAE Dirham"
    },
    {
      value: "CNY",
      label:
        t?.("currency.cny", {defaultValue: "CNY - Chinese Yuan"}) ||
        "CNY - Chinese Yuan"
    },
    {
      value: "HKD",
      label:
        t?.("currency.hkd", {defaultValue: "HKD - Hong Kong Dollar"}) ||
        "HKD - Hong Kong Dollar"
    },
    {
      value: "IDR",
      label:
        t?.("currency.idr", {defaultValue: "IDR - Indonesian Rupiah"}) ||
        "IDR - Indonesian Rupiah"
    },
    {
      value: "ILS",
      label:
        t?.("currency.ils", {defaultValue: "ILS - Israeli Shekel"}) ||
        "ILS - Israeli Shekel"
    },
    {
      value: "INR",
      label:
        t?.("currency.inr", {defaultValue: "INR - Indian Rupee"}) ||
        "INR - Indian Rupee"
    },
    {
      value: "JPY",
      label:
        t?.("currency.jpy", {defaultValue: "JPY - Japanese Yen"}) ||
        "JPY - Japanese Yen"
    },
    {
      value: "KRW",
      label:
        t?.("currency.krw", {defaultValue: "KRW - South Korean Won"}) ||
        "KRW - South Korean Won"
    },
    {
      value: "MYR",
      label:
        t?.("currency.myr", {defaultValue: "MYR - Malaysian Ringgit"}) ||
        "MYR - Malaysian Ringgit"
    },
    {
      value: "PHP",
      label:
        t?.("currency.php", {defaultValue: "PHP - Philippine Peso"}) ||
        "PHP - Philippine Peso"
    },
    {
      value: "SAR",
      label:
        t?.("currency.sar", {defaultValue: "SAR - Saudi Riyal"}) ||
        "SAR - Saudi Riyal"
    },
    {
      value: "SGD",
      label:
        t?.("currency.sgd", {defaultValue: "SGD - Singapore Dollar"}) ||
        "SGD - Singapore Dollar"
    },
    {
      value: "THB",
      label:
        t?.("currency.thb", {defaultValue: "THB - Thai Baht"}) ||
        "THB - Thai Baht"
    },
    {
      value: "TWD",
      label:
        t?.("currency.twd", {defaultValue: "TWD - Taiwan Dollar"}) ||
        "TWD - Taiwan Dollar"
    },
    {
      value: "VND",
      label:
        t?.("currency.vnd", {defaultValue: "VND - Vietnamese Dong"}) ||
        "VND - Vietnamese Dong"
    }
  ]

  return data
}
