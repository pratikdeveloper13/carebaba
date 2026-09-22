import { TopBar } from '../../components/common/TopBar'
import { PageContainer } from '../../components/common/PageContainer'
import { IconTileButton } from '../../components/common/IconTileButton'
import { useTranslation } from '../../hooks/useSettings'

/** The "Smart Add" menu — tap once to jump straight into the matching
 * reading form (Sugar / BP / SpO2). */
export function AddMenu() {
  const { t } = useTranslation()
  return (
    <>
      <TopBar title={t('addMenu.title')} />
      <PageContainer>
        <p className="pb-4 text-base text-slate-600">{t('addMenu.subtitle')}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <IconTileButton
            icon="🩸"
            label={t('sugar.title')}
            to="/add/sugar"
            accentClassName="bg-sugar-bg text-sugar"
            size="lg"
          />
          <IconTileButton
            icon="❤️"
            label={t('bp.title')}
            to="/add/bp"
            accentClassName="bg-bp-bg text-bp"
            size="lg"
          />
          <IconTileButton
            icon="🫁"
            label={t('spo2.title')}
            to="/add/spo2"
            accentClassName="bg-spo2-bg text-spo2"
            size="lg"
          />
        </div>
      </PageContainer>
    </>
  )
}
