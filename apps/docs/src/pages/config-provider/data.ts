import type { KitConfig } from '@ggary/core/config-provider'

/** The app's own labels, in the language of the settings around them. The rest is the provider's. */
export interface Labels {
  save: string
  name: string
  due: string
  leads: string
  files: string
  first: string
  second: string
}

export interface Sample {
  label: string
  config: KitConfig
  text: Labels
}

export const english: Labels = { save: 'Save', name: 'Name', due: 'Due', leads: 'Leads', files: 'Files', first: 'Report', second: 'Brief' }
const russian: Labels = { save: 'Сохранить', name: 'Имя', due: 'Срок', leads: 'Лиды', files: 'Файлы', first: 'Отчёт', second: 'Бриф' }
const arabic: Labels = { save: 'حفظ', name: 'الاسم', due: 'الموعد', leads: 'العملاء', files: 'الملفات', first: 'تقرير', second: 'موجز' }
export const german: Labels = { save: 'Speichern', name: 'Name', due: 'Fällig', leads: 'Leads', files: 'Dateien', first: 'Bericht', second: 'Briefing' }

export const variants: Sample[] = [
  {
    label: 'locale="ru-RU" words',
    config: { locale: 'ru-RU', words: { list: { more: 'Показать ещё', loading: 'Загрузка…' }, datePicker: { choose: 'Выбрать день' } } },
    text: russian,
  },
  {
    label: 'locale="ar-EG" dir="rtl" words',
    config: { locale: 'ar-EG', dir: 'rtl', words: { list: { more: 'عرض المزيد' } } },
    text: arabic,
  },
  { label: 'mode="dark"', config: { mode: 'dark' }, text: english },
  { label: 'mode="light"', config: { mode: 'light' }, text: english },
]

export const SIZES = ['sm', 'md', 'lg'] as const

/** The outer settings of the nested pair: the inner one changes only the size. */
export const outer: KitConfig = { locale: 'de-DE', words: { list: { more: 'Mehr anzeigen' } } }
