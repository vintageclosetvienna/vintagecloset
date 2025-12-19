'use client';

import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Link */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors mb-8"
        >
          <ArrowLeft size={16} weight="bold" />
          Back to Home
        </Link>

        {/* Content */}
        <div className="prose prose-sm md:prose-base max-w-none">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-ink mb-8">
            ALLGEMEINE GESCHÄFTSBEDINGUNGEN
          </h1>

          <div className="space-y-6 text-ink/80 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-ink mt-8 mb-4">ÜBERSICHT</h2>
              <p>
                Diese Website wird von Vintage Closet betrieben. Überall auf der Webseite beziehen sich die Begriffe "wir", "uns" und "unsere/e" auf Vintage Closet.
                Vintage Closet bietet diese Website, einschließlich aller Informationen, Tools und Dienste, die auf dieser Website verfügbar sind, Ihnen, dem Benutzer,
                unter der Bedingung an, dass Sie alle hier angegebenen Bedingungen, Konditionen, Richtlinien und Hinweise akzeptieren.
              </p>
              <p>
                Wenn Sie unsere Website besuchen und/oder etwas bei uns kaufen, nutzen Sie unseren "Dienst" und erklären sich damit einverstanden, an die
                folgenden Allgemeinen Geschäftsbedingungen ("Allgemeine Geschäftsbedingungen", "Bedingungen") gebunden zu sein, einschließlich der zusätzlichen
                Geschäftsbedingungen und Richtlinien, die hierin erwähnt werden und/oder per Hyperlink verfügbar sind. Diese Allgemeinen Geschäftsbedingungen
                gelten für alle Benutzer der Website, insbesondere Benutzer, die Besucher, Anbieter, Kunden, Händler und/oder Verfasser von Inhalten sind.
              </p>
              <p>
                Bitte lesen Sie diese Allgemeinen Geschäftsbedingungen sorgfältig durch, bevor Sie auf unsere Website zugreifen oder diese benutzen. Durch den
                Zugriff auf oder die Nutzung eines jeglichen Teils der Website erklären Sie sich mit diesen Allgemeinen Geschäftsbedingungen einverstanden. Sind Sie
                nicht mit allen Geschäftsbedingungen dieser Vereinbarung einverstanden, dürfen Sie nicht auf die Website zugreifen oder irgendwelche Dienste nutzen.
                Wenn diese Allgemeinen Geschäftsbedingungen als Angebot betrachtet werden, beschränkt sich die Annahme ausdrücklich auf diese Allgemeinen
                Geschäftsbedingungen.
              </p>
              <p>
                Alle neuen Funktionen oder Tools, die zum aktuellen Shop hinzugefügt werden, unterliegen ebenfalls den Allgemeinen Geschäftsbedingungen. Sie
                können die aktuellste Version der Allgemeinen Geschäftsbedingungen jederzeit auf dieser Seite einsehen. Wir behalten uns das Recht vor, Teile dieser
                Allgemeinen Geschäftsbedingungen durch Veröffentlichung von Updates und/oder Änderungen unserer Website zu aktualisieren, zu ändern oder zu
                ersetzen. Es liegt in Ihrer Verantwortung, diese Seite regelmäßig auf mögliche Änderungen zu überprüfen. Indem Sie die Website nach der
                Veröffentlichung von irgendwelchen Änderungen weiterhin nutzen oder weiterhin darauf zugreifen, gilt dies als Annahme dieser Änderungen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mt-8 mb-4">ABSCHNITT 1 - BEDINGUNGEN FÜR DEN ONLINESHOP</h2>
              <p>
                Mit der Zustimmung zu diesen Allgemeinen Geschäftsbedingungen erklären Sie, dass Sie in dem Land Ihres Wohnsitzes mindestens volljährig sind oder
                dass Sie in dem Land Ihres Wohnsitz volljährig sind und uns Ihre Zustimmung gegeben haben, dass Ihre minderjährigen Angehörigen diese Website
                nutzen dürfen.
              </p>
              <p>
                Sie dürfen unsere Produkte weder für illegale oder nicht autorisierte Zwecke nutzen noch dürfen Sie durch die Nutzung der Serviceleistung gegen
                Gesetze in Ihrer Gerichtsbarkeit verstoßen (einschließlich, aber nicht beschränkt auf Urheberrechtsgesetze).
              </p>
              <p>Sie dürfen keine Würmer oder Viren oder sonstigen Code destruktiver Art übertragen.</p>
              <p>Der Verstoß gegen oder die Verletzung irgendeiner dieser Bedingungen führt zur sofortigen Kündigung Ihrer Serviceleistungen.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mt-8 mb-4">ABSCHNITT 2 - ALLGEMEINE BEDINGUNGEN</h2>
              <p>Wir behalten uns das Recht vor, einer Person die Serviceleistung jederzeit aus beliebigem Grund zu verweigern.</p>
              <p>
                Sie nehmen zur Kenntnis, dass Ihre Informationen (außer Kreditkarteninformationen) unverschlüsselt übertragen werden können und (a)
                Übertragungen über verschiedene Netzwerke sowie (b) Änderungen beinhalten können, um den technischen Anforderungen von verbundenen
                Netzwerken oder Geräten zu entsprechen und sich an diese anzupassen. Kreditkarteninformationen werden bei der Übertragung über Netzwerke
                immer verschlüsselt.
              </p>
              <p>
                Sie verpflichten sich, ohne ausdrückliche schriftliche Genehmigung von uns keinen Teil der Serviceleistung, die Nutzung der Serviceleistung oder den
                Zugriff auf die Serviceleistung oder auf jegliche Kontakte auf der Website, durch die die Serviceleistung angeboten wird, zu reproduzieren, zu
                vervielfältigen, zu kopieren, zu verkaufen, weiterzuverkaufen oder zu verwerten.
              </p>
              <p>
                Die in dieser Vereinbarung verwendeten Überschriften dienen nur der Übersichtlichkeit und schränken diese Bedingungen nicht ein oder wirken sich
                anderweitig auf sie aus.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mt-8 mb-4">ABSCHNITT 3 - GENAUIGKEIT, VOLLSTÄNDIGKEIT UND RECHTZEITIGKEIT DER INFORMATIONEN</h2>
              <p>
                Wir sind nicht verantwortlich, wenn die auf dieser Seite zur Verfügung gestellten Informationen nicht genau, vollständig oder aktuell sind. Das Material
                auf dieser Website dient nur der allgemeinen Information und sollte nicht als alleinige Grundlage für Entscheidungen herangezogen werden, ohne
                primäre, genauere, vollständigere oder aktuellere Informationsquellen zu prüfen. Jegliches Vertrauen auf das Material auf dieser Website geschieht auf
                eigene Verantwortung.
              </p>
              <p>
                Diese Seite enthält möglicherweise gewisse historische Informationen. Historische Informationen sind nicht unbedingt aktuell und werden lediglich zu
                Ihrer Orientierung bereitgestellt. Wir behalten uns das Recht vor, Inhalte auf dieser Website jederzeit zu ändern, sind aber nicht verpflichtet,
                irgendwelche Informationen auf unserer Website zu aktualisieren. Sie stimmen zu, dass Sie verantwortlich dafür sind, Änderungen auf unserer Website
                zu überwachen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mt-8 mb-4">ABSCHNITT 4 - ÄNDERUNGEN AN DER LEISTUNG UND DEN PREISEN</h2>
              <p>Die Preise für unsere Produkte können ohne vorherige Ankündigung geändert werden.</p>
              <p>
                Wir behalten uns das Recht vor, die Serviceleistung (oder einen jeglichen Teil oder Inhalt davon) ohne Ankündigung jederzeit zu ändern oder zu
                beenden.
              </p>
              <p>Wir sind weder Ihnen noch Dritten gegenüber haftbar für Änderungen, Preisänderungen, Sperrung oder Einstellung der Serviceleistung.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mt-8 mb-4">ABSCHNITT 5 - PRODUKTE ODER SERVICELEISTUNGEN</h2>
              <p>
                Gewisse Produkte oder Serviceleistungen sind möglicherweise nur online über die Website erhältlich. Diese Produkte oder Serviceleistungen sind unter
                Umständen nur in begrenzten Mengen vorhanden und unterliegen nur der Rückgabe oder dem Umtausch gemäß unseren Rückgaberichtlinien.
              </p>
              <p>
                Wir haben uns bemüht, die Farben und Bilder unserer Produkte, die im Shop erscheinen, so genau wie möglich darzustellen. Wir können nicht
                garantieren, dass Ihr Computerbildschirm jede Farbe korrekt anzeigt.
              </p>
              <p>
                Wir behalten uns das Recht vor, sind aber nicht verpflichtet, den Verkauf unserer Produkte oder Serviceleistungen auf gewisse Personen, geografische
                Regionen oder Gerichtsbarkeiten zu beschränken. Wir können dieses Recht von Fall zu Fall ausüben. Wir behalten uns das Recht vor, die Mengen der
                von uns angebotenen Produkte oder Serviceleistungen zu begrenzen. Alle Produktbeschreibungen oder Produktpreise können jederzeit ohne
                Vorankündigung und nach unserem alleinigen Ermessen geändert werden. Wir behalten uns das Recht vor, jedes Produkt jederzeit aus dem Angebot zu
                nehmen. Jedes Angebot für ein Produkt oder eine Serviceleistung, das auf dieser Website gemacht wird, ist ungültig, wo es verboten ist.
              </p>
              <p>
                Wir garantieren nicht, dass die Qualität von Produkten, Serviceleistungen, Informationen oder anderen Materialien, die von Ihnen gekauft oder
                erworben wurden, Ihren Erwartungen entspricht, oder dass Fehler in der Serviceleistung korrigiert werden.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mt-8 mb-4">ABSCHNITT 6 - RICHTIGKEIT DER RECHNUNGS- UND KONTOINFORMATIONEN</h2>
              <p>
                Wir behalten uns das Recht vor, jegliche Bestellung, die Sie bei uns aufgeben, abzulehnen. Wir können nach eigenem Ermessen die Abnahmemengen
                pro Person, pro Haushalt oder pro Bestellung begrenzen oder stornieren. Diese Einschränkungen können Bestellungen umfassen, die von oder unter
                demselben Kundenkonto oder derselben Kreditkarte aufgegeben wurden und/oder Bestellungen, die dieselbe Rechnungs- und/oder Lieferadresse
                verwenden.
              </p>
              <p>
                Sie stimmen zu, aktuelle, vollständige und richtige Kauf- und Kontoinformationen für alle in unserem Shop getätigten Käufe anzugeben. Sie stimmen zu,
                Ihr Konto und andere Informationen, einschließlich Ihrer E-Mail-Adresse und Kreditkartennummern und Ablaufdaten, umgehend zu aktualisieren, damit
                wir Ihre Transaktionen abschließen und Sie bei Bedarf kontaktieren können.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mt-8 mb-4">ABSCHNITT 7 - ZUSÄTZLICHE TOOLS</h2>
              <p>Wir bieten Ihnen möglicherweise Zugriff auf Tools von Drittanbietern, die wir weder überwachen noch kontrollieren oder beeinflussen können.</p>
              <p>
                Sie stimmen zu, dass wir den Zugriff auf diese Tools "wie besehen" und "wie verfügbar" ohne jegliche Garantien, Zusicherungen oder Bedingungen
                jeglicher Art und ohne jegliche Befürwortung zur Verfügung stellen. Wir übernehmen keinerlei Haftung, die sich aus Ihrer Nutzung von zusätzlichen
                Drittanbieter-Tools ergibt oder damit zusammenhängt.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mt-8 mb-4">ABSCHNITT 13 - HAFTUNGSAUSSCHLUSS; HAFTUNGSBESCHRÄNKUNG</h2>
              <p>
                Wir übernehmen keine Garantie, Verantwortung oder Gewährleistung dafür, dass die Nutzung unserer Serviceleistung ununterbrochen, zeitgerecht,
                sicher oder fehlerfrei erfolgt.
              </p>
              <p>Wir garantieren nicht, dass die Ergebnisse, die durch die Nutzung der Serviceleistung erzielt werden können, genau oder zuverlässig sind.</p>
              <p>
                Auf keinen Fall sind Vintage Closet, unsere Direktoren, leitenden Angestellten, Mitarbeiter, Tochtergesellschaften, Vertreter, Auftragnehmer,
                Praktikanten, Lieferanten, Dienstanbieter oder Lizenzgeber haftbar für irgendwelche Verletzungen, Verluste, Ansprüche oder jegliche direkte, indirekte,
                zufällige, strafende, besondere oder Folgeschäden jeglicher Art.
              </p>
            </section>

            <div className="mt-12 pt-8 border-t border-hairline text-sm text-muted">
              <p>Letzte Aktualisierung: {new Date().toLocaleDateString('de-DE')}</p>
              <p className="mt-2">Bei Fragen zu unseren Geschäftsbedingungen kontaktieren Sie uns bitte unter vintageclosetvienna@gmail.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

