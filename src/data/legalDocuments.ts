import { LegalDocument, LegalSection } from '../types/websiteContent';

/**
 * Default published text for every legal page on the website.
 *
 * Paragraph conventions understood by LegalPageView:
 *   "• text"   renders as a bullet point
 *   "### text" renders as a sub-heading inside the section
 *
 * Stored copies in the `legalPages` collection override these defaults only
 * when their `contentRevision` matches LEGAL_CONTENT_REVISION. Bump the
 * revision whenever the default text below is replaced, so older stored text
 * stops being served.
 */
export const LEGAL_CONTENT_REVISION = '2026-10-27';

const EFFECTIVE_DATE = '27 October 2026';
const PUBLISHED_AT = '2026-10-27T00:00:00.000Z';

const CONTACT_BLOCK =
  'MAHDEV Pvt Ltd\nEmail: info.mahdev.lk@gmail.com\nTelephone: 075 092 8078 / 076 898 8970\nWebsite: mahdev.lk';

type SectionInput = { heading: string; content: string[] };

// Assigns stable ids, numbers and ordering to a list of sections.
function buildSections(prefix: string, sections: SectionInput[]): LegalSection[] {
  return sections.map((section, idx) => ({
    id: `${prefix}-${idx + 1}`,
    number: idx + 1,
    order: idx + 1,
    heading: section.heading,
    content: section.content,
  }));
}

// Shared metadata for every legal document published in this revision.
function buildDocument(
  fields: Pick<LegalDocument, 'id' | 'slug' | 'title' | 'subtitle'>,
  prefix: string,
  sections: SectionInput[]
): LegalDocument {
  return {
    ...fields,
    lastUpdated: EFFECTIVE_DATE,
    effectiveDate: EFFECTIVE_DATE,
    version: '2.0.0',
    status: 'published',
    contentRevision: LEGAL_CONTENT_REVISION,
    createdAt: PUBLISHED_AT,
    updatedAt: PUBLISHED_AT,
    publishedAt: PUBLISHED_AT,
    updatedBy: 'info.mahdev.lk@gmail.com',
    sections: buildSections(prefix, sections),
  };
}

const APPLIES_TO_DIVISIONS =
  'These policies apply to the MAHDEV Pvt Ltd website and its business divisions, including SWS Event Management, U1 Studio, MAHDEV IT & Solutions, MAHDEV Travels and MAHDEV Online Mart.';

// ---------------------------------------------------------------------------
// Privacy Policy
// ---------------------------------------------------------------------------
export const DEFAULT_PRIVACY_CONTENT: LegalDocument = buildDocument(
  {
    id: 'privacyPolicy',
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    subtitle: 'How MAHDEV Pvt Ltd collects, uses, shares and protects personal information.',
  },
  'priv',
  [
    {
      heading: 'Introduction',
      content: [
        'MAHDEV Pvt Ltd ("MAHDEV", "we", "us" or "our") respects the privacy of individuals who visit our website, contact us, make purchases, request quotations or use our services.',
        'This Privacy Policy explains what personal information we collect, why we collect it, how we use and protect it, when we share it and how you can contact us about your information.',
        'We aim to handle personal information responsibly and in accordance with applicable Sri Lankan law.',
        'By using our website or providing personal information to us, you acknowledge that you have had an opportunity to read this policy. Where consent is legally required, we will obtain it separately.',
        APPLIES_TO_DIVISIONS,
      ],
    },
    {
      heading: 'Information We Collect',
      content: [
        'Depending on the service you request, we may collect the following information.',
        '### Personal and contact information',
        '• Full name.',
        '• Email address.',
        '• Telephone or WhatsApp number.',
        '• Billing address.',
        '• Delivery address, where applicable.',
        '• National Identity Card (NIC) information, where reasonably necessary for a legitimate business, verification or legal purpose.',
        'We will not request NIC information unnecessarily. Where it is not needed for the service, customers should not be required to provide it.',
        '### Booking and service information',
        'For event management, photography, travel and other services, we may collect:',
        '• Event or service date.',
        '• Event or service location.',
        '• Booking details and selected packages.',
        '• Customer requirements and instructions.',
        '• Quotations, invoices and payment records.',
        '• Communications relating to the service.',
        '• Information necessary to arrange accommodation, transport or other travel services.',
        '### Online Mart information',
        'When you purchase products, we may collect:',
        '• Items ordered and quantities.',
        '• Billing and delivery information.',
        '• Order history.',
        '• Delivery instructions.',
        '• Payment confirmation or transaction references.',
        '• Return, refund and customer support information.',
        'We do not intend to collect complete bank account credentials, online banking passwords, PINs or one-time passwords through our website or customer support channels.',
        '### Account information',
        'If you register for an account, we may collect the information necessary to create and maintain it, authenticate your identity and provide account-related services.',
        'You are responsible for keeping your login credentials confidential.',
        '### Technical information',
        'Depending on the features enabled on our website, we and our service providers may collect:',
        '• IP address.',
        '• Browser and device information.',
        '• Operating system.',
        '• Website usage and interaction information.',
        '• Approximate location derived from technical information.',
        '• Cookies and similar identifiers.',
        '• Security logs and error reports.',
        'The specific information collected depends on the technologies actually enabled on the website.',
      ],
    },
    {
      heading: 'How We Use Personal Information',
      content: [
        'We may use your information to:',
        '• Respond to inquiries and requests.',
        '• Prepare quotations and proposals.',
        '• Create, confirm and manage bookings.',
        '• Process orders and arrange deliveries.',
        '• Provide photography, event, travel, software and other services.',
        '• Verify payments and maintain financial records.',
        '• Communicate booking changes, delivery updates and service information.',
        '• Manage customer accounts.',
        '• Provide customer support and resolve complaints.',
        '• Improve website performance and user experience.',
        '• Protect our website, business, customers and transactions against fraud or misuse.',
        '• Maintain business records and meet applicable legal obligations.',
        '• Send promotional communications where permitted and, where required, with your consent.',
        'We will not use personal information for an unrelated purpose without an appropriate legal basis or any consent required by law.',
      ],
    },
    {
      heading: 'Legal Basis for Processing',
      content: [
        'Where applicable law requires a legal basis for processing personal information, we will rely on the basis appropriate to the circumstances.',
        'This may include:',
        '• Your consent.',
        '• Taking steps at your request before entering into a contract.',
        '• Performing a contract or providing a service you requested.',
        '• Complying with legal obligations.',
        '• Protecting legitimate business interests, where legally permitted and balanced against your rights.',
        'Where consent is relied upon, you may withdraw it subject to applicable law. Withdrawal does not automatically invalidate processing lawfully carried out before withdrawal.',
      ],
    },
    {
      heading: 'Payment Information',
      content: [
        'We currently intend to support payment methods including bank transfers, cash, online bank payments and advance payments, depending on the service.',
        'Payment arrangements will be communicated before a transaction is confirmed.',
        'We may retain payment confirmations, transaction references, invoices and related accounting records.',
        'If a third-party payment service is introduced, the payment information processed by that provider will also be subject to its applicable privacy and security terms.',
        'Customers should never send banking passwords, PINs or one-time passwords to MAHDEV.',
      ],
    },
    {
      heading: 'Cookies and Similar Technologies',
      content: [
        'Our website may use essential cookies and similar technologies to support website functionality, security, preferences and customer sessions.',
        'Where analytics, advertising or other tracking tools are enabled, they may collect information about website usage.',
        'We may use Google Analytics or similar analytics services if configured on the website. Google Maps may be used to display locations, directions or other mapping information.',
        'The actual technologies used will depend on the website configuration.',
        'Where required by applicable law, we will obtain consent before placing or using non-essential cookies or similar tracking technologies.',
        'For additional information, please refer to our Cookie Policy.',
      ],
    },
    {
      heading: 'Google Services and Other Third Parties',
      content: [
        'Our website may integrate with third-party services such as:',
        '• Firebase and Google Cloud services.',
        '• Google Analytics.',
        '• Google Maps.',
        '• WhatsApp.',
        '• Authentication providers.',
        '• Email and communication services.',
        '• Hosting and website infrastructure providers.',
        '• Delivery and courier companies.',
        '• Travel operators, accommodation providers and transport providers.',
        '• Payment or banking service providers, where applicable.',
        'These providers may process personal information to perform the services for which they are engaged or when you interact directly with their services.',
        'Their own privacy policies and terms may apply.',
        'We will not claim that a particular provider is used unless the relevant integration is actually enabled.',
      ],
    },
    {
      heading: 'Sharing Personal Information',
      content: [
        'We may share relevant information with:',
        '• Employees and authorised personnel who need it to perform their duties.',
        '• Technology providers that host, maintain or secure our website.',
        '• Payment providers and financial institutions to verify transactions.',
        '• Courier companies to fulfil deliveries.',
        '• Travel operators, accommodation providers and transport companies to fulfil bookings.',
        '• Contractors and service partners involved in delivering a service you requested.',
        '• Professional advisers, auditors or insurers where appropriate.',
        '• Public authorities or law enforcement where required or permitted by law.',
        'We aim to limit information shared with third parties to what is reasonably necessary for the relevant purpose.',
        "We do not sell customers' personal information to third parties as a business practice.",
      ],
    },
    {
      heading: 'International Data Transfers',
      content: [
        'Some technology or service providers may process or store information outside Sri Lanka.',
        'Where personal information is transferred internationally, we will take the steps required by applicable law and the circumstances of the transfer.',
        'Customers should understand that information processed by an overseas service provider may be subject to the laws applicable to that provider.',
      ],
    },
    {
      heading: 'Data Security',
      content: [
        'We use reasonable technical and organisational measures intended to protect personal information against unauthorised access, alteration, disclosure, loss or misuse.',
        'Depending on the systems used, these measures may include:',
        '• Access controls.',
        '• Authentication and permissions.',
        '• Secure transmission.',
        '• Restricted administrative access.',
        '• Appropriate security settings for databases and storage.',
        '• Backups and recovery procedures.',
        '• Monitoring and investigation of suspected security incidents.',
        'No website, database or electronic transmission can be guaranteed to be completely secure.',
        'We will address security incidents in accordance with applicable legal requirements.',
      ],
    },
    {
      heading: 'Data Retention',
      content: [
        'We retain personal information only for as long as reasonably necessary for the purposes described in this policy, subject to applicable legal requirements.',
        'Retention periods may depend on:',
        '• The type of service.',
        '• Booking and transaction history.',
        '• Accounting and tax requirements.',
        '• Dispute resolution.',
        '• Contractual obligations.',
        '• Security and fraud prevention.',
        '• Legal claims and regulatory requirements.',
        'When information is no longer required, we will take appropriate steps to delete it, anonymise it or securely dispose of it, subject to lawful retention obligations.',
      ],
    },
    {
      heading: 'Your Privacy Rights',
      content: [
        'Depending on applicable law and the circumstances, you may be entitled to:',
        '• Request information about the personal information we hold about you.',
        '• Request access to your personal information.',
        '• Request correction of inaccurate information.',
        '• Request deletion or restriction of information where legally available.',
        '• Withdraw consent where processing depends on consent.',
        '• Object to certain processing where applicable.',
        '• Raise a privacy complaint with us or the appropriate authority.',
        'To submit a privacy request, contact us using the details at the end of this policy.',
        'We may need to verify your identity before responding. We may also retain or continue processing certain information where permitted or required by law.',
      ],
    },
    {
      heading: "Children's Privacy",
      content: [
        'Our website is intended to be used responsibly by customers of appropriate age.',
        'Individuals under 18 may use our website with appropriate parent or guardian involvement.',
        'Where a service or transaction requires a person to be legally capable of entering into a contract, a parent, guardian or other legally authorised person may need to make the booking or enter into the agreement.',
        'We do not knowingly seek unnecessary personal information directly from children.',
      ],
    },
    {
      heading: 'External Websites',
      content: [
        'Our website may contain links to external websites, payment services, social media platforms and other third-party services.',
        'We do not control the privacy practices or security of external websites.',
        'Customers should review the applicable privacy policy before submitting information to a third-party website.',
      ],
    },
    {
      heading: 'Changes to This Policy',
      content: [
        'We may update this Privacy Policy when our services, website technologies, business practices or legal obligations change.',
        'The latest version will be published on our website with an updated revision date.',
        'Material changes will be communicated where required by applicable law.',
      ],
    },
    {
      heading: 'Contact Us',
      content: [
        'For privacy questions or requests, contact:',
        CONTACT_BLOCK,
        'Please include "Privacy Request" in the subject of your email.',
      ],
    },
  ]
);

// ---------------------------------------------------------------------------
// Terms and Conditions (includes the service-specific booking terms)
// ---------------------------------------------------------------------------
export const DEFAULT_TERMS_CONTENT: LegalDocument = buildDocument(
  {
    id: 'termsAndConditions',
    slug: 'terms-and-conditions',
    title: 'Terms and Conditions',
    subtitle: 'The terms that govern use of the MAHDEV Pvt Ltd website and the products and services offered through it.',
  },
  'terms',
  [
    {
      heading: 'Introduction',
      content: [
        'These Terms and Conditions govern your access to and use of the MAHDEV Pvt Ltd website and the products and services offered through it.',
        'By accessing the website, requesting a quotation, placing an order or confirming a booking, you agree to the terms applicable to the relevant transaction.',
        'If you do not agree with these Terms and Conditions, please do not use the relevant service.',
        'Specific quotations, booking confirmations, invoices and written agreements may contain additional terms. Where a specific term has been expressly agreed in writing for a transaction, it will apply to that transaction to the extent legally permitted.',
      ],
    },
    {
      heading: 'About MAHDEV Pvt Ltd',
      content: [
        'MAHDEV Pvt Ltd operates the following business divisions:',
        '• SWS Event Management.',
        '• U1 Studio.',
        '• MAHDEV IT & Solutions.',
        '• MAHDEV Travels.',
        '• MAHDEV Online Mart.',
        'The services, prices, availability and conditions applicable to each division may differ.',
        'A service is not considered confirmed merely because it appears on the website or a customer submits an inquiry.',
      ],
    },
    {
      heading: 'Eligibility and Customer Responsibilities',
      content: [
        'Customers under 18 may use the website with appropriate parent or guardian involvement.',
        'Where a transaction requires legal capacity, a parent, guardian or other legally authorised person must enter into the relevant agreement when required by law.',
        'Customers agree to:',
        '• Provide accurate and complete information.',
        '• Use valid contact details.',
        '• Provide correct delivery addresses and service locations.',
        '• Disclose relevant requirements and restrictions.',
        '• Make payments according to the agreed terms.',
        '• Avoid fraudulent, unlawful or abusive use of the website.',
        '• Respect the intellectual property and rights of MAHDEV and third parties.',
        'Customers are responsible for promptly notifying us of any material changes to their booking or order information.',
      ],
    },
    {
      heading: 'Quotations, Prices and Availability',
      content: [
        'Prices may depend on the selected package, quantity, location, date, customisation, delivery requirements and other relevant factors.',
        'A quotation may specify:',
        '• The services or products included.',
        '• The price and applicable charges.',
        '• The payment schedule.',
        '• The service date or delivery estimate.',
        "• The quotation's validity period.",
        '• Any exclusions or special conditions.',
        "A quotation is subject to its stated validity period and availability.",
        'Additional work, requested changes, additional products, travel expenses or other costs not included in the original quotation may require a revised quotation and customer approval.',
        'We will communicate material price changes before proceeding with the affected order or service.',
      ],
    },
    {
      heading: 'Bookings and Confirmation',
      content: [
        'Submitting an inquiry, completing a contact form or requesting a quotation does not automatically confirm a booking.',
        'A booking becomes confirmed when MAHDEV accepts the booking and communicates confirmation, subject to any required advance payment or other stated conditions.',
        'Customers should retain their quotations, receipts, booking confirmations and relevant written communications.',
        'For event services, customers should provide accurate event dates, venues, access arrangements, setup requirements and other necessary information.',
        'For travel services, customers must provide accurate passenger, travel-date and destination information.',
      ],
    },
    {
      heading: 'Payments',
      content: [
        'MAHDEV may accept bank transfers, cash, online bank payments and advance payments, depending on the service and the arrangements communicated to the customer.',
        'The accepted methods and payment instructions will be stated in the relevant quotation, invoice or booking confirmation.',
        'Customers must use verified payment instructions. If payment details appear suspicious or have changed unexpectedly, customers should confirm them with MAHDEV through an established contact channel.',
        'A payment is treated as received when it has been successfully received or verified by MAHDEV.',
        '### Event management',
        'The amount of any advance payment depends on the agreed package or quotation.',
        'Unless otherwise agreed in writing, the remaining balance for event decoration services is payable after the agreed decoration work has been completed.',
        'Any different payment schedule must be stated in the applicable quotation or booking confirmation.',
        '### Studio services',
        'For U1 Studio services, payment is due when the agreed deliverables have been delivered, unless a different payment schedule is agreed in writing.',
        'Where an advance or milestone payment is required, the applicable schedule will be stated in the quotation.',
        '### Online Mart',
        'For MAHDEV Online Mart, the payment arrangement will be communicated at checkout or confirmation.',
        'Where payment on receipt is expressly agreed, the customer must pay upon receiving the item.',
        'Cash on delivery will be offered only where MAHDEV expressly makes that option available.',
        '### IT and software services',
        'Website development, mobile application development and other IT projects may use advance payments, milestone payments or other agreed arrangements.',
        'The payment schedule, project scope, deliverables and acceptance criteria should be recorded in the relevant proposal or agreement.',
        '### Travel services',
        'Travel bookings may require deposits, advance payment or full payment before confirmation, depending on the supplier and booking conditions.',
        'Third-party suppliers may impose separate payment deadlines.',
        'The applicable arrangements will be communicated before confirmation wherever reasonably possible.',
      ],
    },
    {
      heading: 'Event Management Services',
      content: [
        'SWS Event Management may provide wedding decorations, birthday decorations, event planning, event equipment, photography coordination and other event-related services.',
        'Customers must provide accurate information about the venue, date, event requirements and access arrangements.',
        'The agreed quotation will determine the scope of work, equipment, decoration items, setup arrangements and other included services.',
        'Changes requested after confirmation may affect the price, availability and completion time.',
        'MAHDEV may propose a reasonable alternative if a particular decoration item or material becomes unavailable. Any material substitution will be discussed with the customer.',
        'Customers must ensure that the venue permits the agreed setup and that necessary permissions, access and facilities are available.',
        'If a venue restriction, unsafe condition or customer-side delay affects the work, the parties will communicate to determine a reasonable solution.',
        'The applicable Refund and Cancellation Policy also applies to event bookings.',
      ],
    },
    {
      heading: 'Photography and Studio Services',
      content: [
        'U1 Studio may provide photography, videography, editing, albums, frames and other creative services.',
        'The quotation or booking confirmation should specify the agreed package, deliverables, shooting arrangements, delivery method and any editing or revision allowance.',
        'Customers are responsible for providing accurate event details and informing us of relevant requirements before the session.',
        'Editing, retouching, delivery formats and revision limits may vary by package.',
        'Customers should review any proof or preview supplied for approval and report identifiable errors within the agreed review period.',
        'Unless otherwise agreed, original unedited files, project files and unused photographs are not automatically included in a package.',
        'Delivery of photographs or videos does not transfer copyright or grant unrestricted commercial use unless expressly agreed in writing.',
        'Where customers request the use of identifiable people in promotional material, MAHDEV will obtain any permission or other lawful basis required for that use.',
      ],
    },
    {
      heading: 'IT and Software Services',
      content: [
        'MAHDEV IT & Solutions may provide websites, mobile applications, software development, integrations, maintenance and other technology services.',
        'The project scope should be agreed in writing, including:',
        '• Functional requirements.',
        '• Deliverables.',
        '• Estimated timelines.',
        '• Payment milestones.',
        '• Customer responsibilities.',
        '• Hosting and third-party costs.',
        '• Maintenance and support arrangements.',
        '• Intellectual property and licensing terms.',
        'Customers must provide the information, access, approvals and materials reasonably required to complete the project.',
        'Project timelines may be affected by delayed approvals, changes in scope, third-party dependencies or circumstances outside reasonable control.',
        'Additional work outside the agreed scope may require a revised quotation.',
        'Unless otherwise agreed in writing, ownership and licensing of custom deliverables, source code, designs, third-party components and reusable tools will be determined by the relevant project agreement and applicable law.',
        "Customers must not use MAHDEV's services to develop, distribute or operate unlawful content or activities.",
      ],
    },
    {
      heading: 'Travel Services',
      content: [
        'MAHDEV Travels may provide travel planning, transportation, accommodation arrangements, tours and other travel-related services.',
        'Some services may be delivered by independent third-party suppliers.',
        "Where a booking involves a third-party provider, the provider's relevant terms, availability, cancellation rules and charges may apply in addition to the MAHDEV booking arrangements.",
        'Customers are responsible for providing accurate passenger details and ensuring that they hold the required travel documents, visas, permits and other authorisations applicable to their journey.',
        'Travel schedules, accommodation availability, transport arrangements and tour activities may change due to weather, operational conditions, supplier decisions or other circumstances.',
        'MAHDEV will communicate material changes where reasonably practicable and assist with available alternatives in accordance with the applicable booking terms.',
        'Any refund entitlement will depend on the service purchased, the applicable supplier conditions, the circumstances and applicable law.',
      ],
    },
    {
      heading: 'Online Mart Products',
      content: [
        'Product descriptions, photographs, prices and availability are provided to help customers make informed purchasing decisions.',
        'We aim to describe products accurately, but minor differences in colour, appearance or presentation may occur because of lighting, display settings or manufacturing variations.',
        'A material difference between a product and its description will be addressed in accordance with the applicable consumer rights and Refund and Cancellation Policy.',
        'Orders are subject to availability and confirmation.',
        'Customers must check the delivered item and report damage, defects, missing items or incorrect products promptly.',
        'Nothing in these terms removes any rights that customers may have under applicable consumer protection law.',
      ],
    },
    {
      heading: 'Delivery and Collection',
      content: [
        'Available delivery and collection methods will be communicated before an order is confirmed.',
        'Delivery estimates are provided in good faith and may vary depending on stock availability, courier operations, location and other circumstances.',
        'Customers must provide accurate delivery details and make reasonable arrangements to receive their orders.',
        'Additional delivery charges may apply if an address change, failed delivery or redelivery is requested, where such charges are disclosed and legally permissible.',
        'The applicable Shipping and Delivery Policy provides further details.',
      ],
    },
    {
      heading: 'Intellectual Property',
      content: [
        'Unless otherwise stated, website content, branding, logos, designs, text, graphics and original materials belonging to MAHDEV are protected by applicable intellectual property laws.',
        'Customers may not reproduce, distribute, modify or commercially exploit MAHDEV-owned materials without prior permission, except where permitted by law.',
        'This section does not transfer ownership of customer-provided materials to MAHDEV.',
        'The intellectual property terms for commissioned photography, designs, websites, software and other deliverables may be specified in a separate written agreement.',
        'Third-party names, trademarks, images, software and other materials remain the property of their respective owners.',
      ],
    },
    {
      heading: 'Website Availability and Security',
      content: [
        'We aim to keep our website available and functioning correctly but cannot guarantee uninterrupted access.',
        'We may temporarily suspend features for maintenance, security, technical improvements or circumstances outside our reasonable control.',
        'Customers must not attempt to access restricted systems, interfere with website functionality, introduce malicious software or misuse website forms and accounts.',
      ],
    },
    {
      heading: 'Customer Communications',
      content: [
        'We may contact customers by telephone, email, SMS or WhatsApp regarding inquiries, bookings, orders, payments, deliveries and customer support.',
        'Customers should provide accurate contact details and notify us if those details change.',
        'Promotional communications will be handled in accordance with applicable law and any consent requirements.',
      ],
    },
    {
      heading: 'Third-Party Services',
      content: [
        'Our website may link to or integrate with third-party services.',
        'MAHDEV does not control every aspect of the availability, content, security or terms of external services.',
        'Where a third-party provider supplies a service directly, its applicable terms may also apply.',
        'This provision does not exclude responsibility that MAHDEV cannot lawfully exclude.',
      ],
    },
    {
      heading: 'Limitation of Liability',
      content: [
        'To the extent permitted by applicable law, MAHDEV will not be responsible for indirect losses that could not reasonably have been anticipated when the relevant agreement was entered into.',
        'Nothing in these terms excludes or limits liability for fraud, wilful misconduct, death or personal injury where exclusion is prohibited, or any other liability that cannot legally be excluded or limited.',
        "Any liability limitation in a specific quotation or agreement must be interpreted consistently with applicable law and the customer's mandatory legal rights.",
      ],
    },
    {
      heading: 'Circumstances Beyond Our Control',
      content: [
        'A party will not be treated as having breached an obligation to the extent that performance is prevented by circumstances beyond its reasonable control, subject to applicable law.',
        'Examples may include severe weather, natural disasters, government restrictions, serious transport disruptions, widespread service outages or other extraordinary events.',
        'The affected party should notify the other party as soon as reasonably practicable.',
        'Where a booking cannot proceed, MAHDEV will communicate available alternatives and any applicable refund arrangements.',
      ],
    },
    {
      heading: 'Complaints and Disputes',
      content: [
        'Customers should first contact MAHDEV to explain the issue and provide relevant order numbers, booking confirmations, receipts or supporting information.',
        'We will review complaints and attempt to resolve them fairly.',
        'If a dispute cannot be resolved directly, the parties may pursue any remedies available under applicable Sri Lankan law.',
        'Nothing in this section prevents a customer from contacting an appropriate consumer protection authority or exercising a legal right.',
      ],
    },
    {
      heading: 'Governing Law',
      content: [
        'These Terms and Conditions are intended to be governed by the laws of Sri Lanka, subject to any mandatory legal protections or jurisdictional requirements that apply.',
        'Any dispute will be handled by a court or other competent authority with jurisdiction under applicable law.',
      ],
    },
    {
      heading: 'Service-Specific Booking Terms',
      content: [
        'These supplementary terms explain how customers should confirm bookings and provide information for particular services. They operate alongside these Terms and Conditions and the Refund and Cancellation Policy.',
        '### SWS Event Management',
        'Before confirming an event booking, customers should review:',
        '• Event date and venue.',
        '• Decoration package and inclusions.',
        '• Setup and dismantling arrangements.',
        '• Advance payment and remaining balance.',
        '• Additional charges.',
        '• Cancellation and date-change conditions.',
        'Changes to the venue, event date, design or package may affect availability and pricing.',
        'Customers must ensure that venue access, permissions and relevant facilities are available.',
        '### U1 Studio',
        'Before confirming a photography or videography booking, customers should review:',
        '• Date, time and location.',
        '• Package inclusions.',
        '• Number or type of deliverables, where specified.',
        '• Editing and revision allowances.',
        '• Delivery format and estimated delivery time.',
        '• Payment arrangements.',
        '• Cancellation conditions.',
        'Any special requirements should be communicated before the session.',
        '### MAHDEV IT & Solutions',
        'Before starting a software project, customers should review and approve:',
        '• Project scope and deliverables.',
        '• Price and payment milestones.',
        '• Estimated timeline.',
        '• Required integrations and third-party services.',
        '• Hosting, domain and subscription costs.',
        '• Testing and acceptance arrangements.',
        '• Maintenance and support terms.',
        '• Intellectual property arrangements.',
        'Any material change to the approved scope may require written approval and an updated quotation.',
        '### MAHDEV Travels',
        'Before confirming a travel booking, customers should review:',
        '• Travel dates and destination.',
        '• Passenger details.',
        '• Transport or accommodation arrangements.',
        '• Included and excluded services.',
        '• Payment deadlines.',
        '• Supplier conditions.',
        '• Cancellation and change fees.',
        '• Required travel documents and permissions.',
        'Where an independent supplier is involved, the applicable supplier conditions should be communicated before the customer commits to the booking, where reasonably practicable.',
        '### MAHDEV Online Mart',
        'Before confirming an order, customers should review:',
        '• Product description and quantity.',
        '• Price and applicable charges.',
        '• Delivery or collection option.',
        '• Estimated delivery time.',
        '• Payment method.',
        '• Return, replacement and refund conditions.',
        'Customers should provide accurate contact and delivery information and retain their order confirmation.',
      ],
    },
    {
      heading: 'Changes to These Terms',
      content: [
        'We may revise these Terms and Conditions when our business, services or legal obligations change.',
        'The current version will be published on our website with an updated revision date.',
        'Changes to an existing confirmed booking or contract will be handled in accordance with the applicable agreement and law.',
      ],
    },
    {
      heading: 'Contact Information',
      content: [CONTACT_BLOCK],
    },
  ]
);

// ---------------------------------------------------------------------------
// Refund and Cancellation Policy
// ---------------------------------------------------------------------------
export const DEFAULT_REFUND_CONTENT: LegalDocument = buildDocument(
  {
    id: 'refundPolicy',
    slug: 'refund-policy',
    title: 'Refund and Cancellation Policy',
    subtitle: 'How cancellations, refunds, returns and replacements are handled across MAHDEV Pvt Ltd divisions.',
  },
  'refund',
  [
    {
      heading: 'Purpose',
      content: [
        'This policy explains how cancellations, refunds, returns and replacements are handled for products and services offered by MAHDEV Pvt Ltd.',
        'Different rules apply to event management, studio services, IT projects, travel bookings and online purchases.',
        'All refund decisions are subject to applicable law and any valid, clearly communicated terms agreed for the relevant transaction.',
      ],
    },
    {
      heading: 'General Principles',
      content: [
        'Customers should contact MAHDEV as soon as possible when requesting a cancellation, refund, return or replacement.',
        'Requests should include:',
        '• Customer name.',
        '• Booking reference or order number.',
        '• Date of purchase or booking.',
        '• Description of the issue.',
        '• Reason for the request.',
        '• Relevant photographs, receipts or other supporting evidence, where applicable.',
        'We will assess each request based on the service or product, the work completed, costs incurred, the reason for cancellation and any applicable supplier conditions.',
        'A policy term cannot remove a mandatory consumer right.',
      ],
    },
    {
      heading: 'Event Management Cancellations',
      content: [
        'This section applies to SWS Event Management and related event decoration services.',
        '### Customer cancellations',
        'Customers should submit cancellation requests in writing as soon as possible.',
        'The applicable quotation or booking confirmation should identify any agreed cancellation schedule, including deadlines and charges.',
        'Where a cancellation schedule has not been agreed, MAHDEV will assess the request based on:',
        '• Work already completed.',
        '• Materials purchased specifically for the event.',
        '• Non-recoverable supplier commitments.',
        '• Reasonable costs already incurred.',
        '• The timing of the cancellation.',
        '• Amounts already paid.',
        '• Any refund or other rights required by applicable law.',
        'Any amount retained must have a reasonable basis under the applicable agreement and law.',
        '### Advance payments',
        'An advance payment is used to secure the booking and may be applied toward agreed work, materials or other booking costs.',
        'An advance is not automatically refundable or automatically forfeited in every situation.',
        'The refund entitlement will depend on the agreed cancellation terms, costs incurred, circumstances and applicable law.',
        'Customers should request written confirmation of any cancellation charge before confirming a booking.',
        '### Changes to the event date',
        'Customers who wish to change an event date should contact us as early as possible.',
        'Date changes depend on availability and may affect pricing, supplier costs and other arrangements.',
        'A date change is not confirmed until MAHDEV communicates acceptance in writing.',
        '### Cancellation by MAHDEV',
        'If MAHDEV cancels a confirmed booking and cannot provide the agreed service, the customer will be offered a refund of payments attributable to the undelivered service.',
        'Where only part of a service has been delivered, the parties will assess the undelivered portion and any applicable contractual or legal entitlement.',
        'Any refund required by law will be provided regardless of an inconsistent contractual term.',
      ],
    },
    {
      heading: 'U1 Studio Refunds and Cancellations',
      content: [
        'This section applies to photography, videography, editing, albums, frames and related studio services.',
        '### Cancellation before the service begins',
        'Customers should notify MAHDEV as early as possible.',
        'Any refund will depend on the agreed booking terms, work already performed, non-recoverable costs and applicable law.',
        '### Cancellation after work begins',
        'If a customer cancels after a photography session, editing work or production has begun, the amount payable or refundable may take account of:',
        '• Work completed.',
        '• Deliverables already supplied.',
        '• Materials or production costs.',
        '• Non-recoverable third-party expenses.',
        '• The agreed cancellation terms.',
        'Any amount retained must be justified by the agreement, actual circumstances and applicable law.',
        '### Defective or incorrect deliverables',
        'If an agreed deliverable is missing, materially defective or inconsistent with the confirmed package, the customer should notify us promptly.',
        'Where appropriate, MAHDEV may correct the issue, re-edit the relevant material, provide the missing deliverable or offer another appropriate remedy.',
        'If the issue cannot reasonably be resolved, any further refund or remedy will be determined under the agreement and applicable law.',
        '### Customer dissatisfaction',
        'Creative preferences can be subjective.',
        'Customers should review the agreed package, style, editing scope and revision allowance before confirming a booking.',
        'A disagreement with a creative choice does not automatically entitle a customer to a full refund if the agreed service has been properly delivered. However, this does not remove rights arising from defective, misrepresented or undelivered services.',
      ],
    },
    {
      heading: 'IT and Software Project Refunds',
      content: [
        'This section applies to website development, mobile applications, custom software and related technology services.',
        '### Before work begins',
        'If a project is cancelled before work starts, the refund will be determined by the agreed project terms and any permitted costs already incurred.',
        '### After work begins',
        'Where a project is cancelled after work starts, the parties should review:',
        '• The agreed project scope.',
        '• Work completed.',
        '• Milestones achieved.',
        '• Deliverables already supplied.',
        '• Approved additional work.',
        '• Third-party costs and commitments.',
        '• Payments already made.',
        'Any amount retained or refunded must be consistent with the project agreement and applicable law.',
        '### Missed deliverables or defects',
        'Customers should report material defects or missing agreed features in writing, with sufficient details to investigate the issue.',
        'Where the issue falls within the agreed scope, MAHDEV will assess and, where appropriate, correct it according to the project agreement.',
        'Refunds or other remedies will be assessed where the agreed service cannot reasonably be delivered or corrected, subject to applicable law.',
        '### Third-party costs',
        'Hosting, domains, licences, subscriptions and other third-party services may be subject to separate supplier terms.',
        'Any non-refundable third-party cost must be disclosed where reasonably practicable and handled in accordance with the applicable agreement and law.',
      ],
    },
    {
      heading: 'MAHDEV Travels Refunds and Cancellations',
      content: [
        'Travel bookings may include transport, accommodation, tours, experiences and third-party arrangements.',
        '### Customer cancellations',
        'Cancellation requests should be submitted as soon as possible.',
        'Refund eligibility may depend on:',
        '• The cancellation deadline.',
        '• The type of booking.',
        '• Supplier cancellation conditions.',
        '• Amounts already paid to suppliers.',
        '• Any disclosed cancellation charges.',
        '• The reason for cancellation.',
        '• Applicable law.',
        'Where third-party supplier terms apply, MAHDEV will explain the relevant conditions to the extent they are available and applicable to the booking.',
        '### Changes to travel plans',
        'Changes to passenger names, dates, destinations, accommodation or transport may involve additional costs or restrictions.',
        "Any change is subject to availability and the relevant supplier's conditions.",
        'Customers should not assume that a requested change has been accepted until written confirmation is received.',
        '### Cancellation by MAHDEV or a supplier',
        'If MAHDEV cannot provide a confirmed service, we will communicate available alternatives.',
        'Where MAHDEV is responsible for cancelling the service and cannot provide it, payments for the undelivered service will be refunded as required by applicable law and the agreement.',
        "Where an independent supplier cancels, the refund or alternative arrangements will depend on the supplier's conditions, the booking agreement and applicable law.",
        'MAHDEV will assist with the process where the booking was arranged through us.',
        '### Extraordinary circumstances',
        'Weather events, government restrictions, transport disruptions and other exceptional circumstances may affect travel.',
        'The available refund or rescheduling options will depend on the circumstances, supplier conditions and applicable law.',
      ],
    },
    {
      heading: 'MAHDEV Online Mart Returns and Refunds',
      content: [
        'This section applies to physical products purchased through MAHDEV Online Mart.',
        '### Incorrect, damaged, defective or missing products',
        'Customers should inspect deliveries and contact MAHDEV promptly if an item is:',
        '• Damaged on arrival.',
        '• Defective.',
        '• Incorrect.',
        '• Missing from the order.',
        '• Materially different from its confirmed description.',
        'Please provide the order number and supporting photographs or other evidence where appropriate.',
        'We will review the issue and, where justified, arrange an appropriate remedy, which may include repair, replacement, delivery of missing items or a refund.',
        'The available remedy will depend on the circumstances and applicable law.',
        '### Change of mind',
        'Requests to return an item because the customer has changed their mind will be assessed under the applicable product terms and law.',
        'A change-of-mind return is not automatically available for every product.',
        'Where a return is accepted, we will explain the return conditions, condition requirements and any permitted charges before proceeding.',
        '### Product condition',
        'Where a return is accepted, customers should follow the return instructions and take reasonable care of the item.',
        'Where relevant, the original packaging, accessories and proof of purchase should be included.',
        'Packaging or condition requirements will not be applied to improperly restrict mandatory rights relating to defective or misdescribed products.',
        '### Products that cannot be returned',
        'Certain products may be unsuitable for return for hygiene, safety, customisation or other legitimate reasons.',
        'Any applicable exclusions will be communicated before purchase where required.',
        'No exclusion will remove a mandatory legal remedy for a defective, misdescribed or otherwise legally non-compliant product.',
        '### Delivery problems',
        'If an item is lost, delivered to the wrong address or not received, customers should contact MAHDEV with their order details.',
        'We will investigate the issue and coordinate with the delivery provider where appropriate.',
        'The outcome will depend on the circumstances, delivery arrangement and applicable law.',
      ],
    },
    {
      heading: 'Refund Processing',
      content: [
        'Once a refund is approved, MAHDEV will communicate the approved amount and expected processing method.',
        'Refunds may be made by bank transfer or another mutually appropriate and legally permitted method.',
        'Where possible, refunds will be returned using the original payment method. If that is not practical, we may request the information reasonably necessary to arrange an alternative.',
        'We aim to process approved refunds within 14 business days, unless a different period is communicated for a particular transaction or applicable law requires otherwise.',
        'The time taken for a bank or other financial institution to credit the funds may vary.',
        'Customers should never provide their banking password, PIN or one-time password to request a refund.',
      ],
    },
    {
      heading: 'Refunds for Cash Payments',
      content: [
        'Where a customer originally paid in cash, MAHDEV will agree on a reasonable refund method with the customer.',
        'Identity or transaction verification may be required to prevent fraud.',
        'Any such verification will be limited to information reasonably necessary for the refund.',
      ],
    },
    {
      heading: 'Partial Refunds',
      content: [
        'A partial refund may be appropriate where:',
        '• Part of a service has been delivered.',
        '• Some agreed deliverables remain outstanding.',
        '• Only part of an order is affected.',
        '• A partial remedy is agreed and legally permissible.',
        'The calculation and reason for the partial refund will be communicated to the customer.',
      ],
    },
    {
      heading: 'Non-Refundable Costs',
      content: [
        'Certain costs may be non-recoverable, including disclosed third-party booking charges, materials purchased specifically for an order or work already performed.',
        'Such costs will only be retained where justified by the applicable agreement, the actual circumstances and applicable law.',
        "A general statement that all deposits, fees or payments are non-refundable will not override a customer's mandatory legal rights.",
      ],
    },
    {
      heading: 'How to Request a Refund',
      content: [
        'Contact:',
        'MAHDEV Pvt Ltd\nEmail: info.mahdev.lk@gmail.com\nTelephone: 075 092 8078 / 076 898 8970',
        'Suggested email subject: "Refund or Cancellation Request"',
        'Please include the relevant booking or order reference and explain the reason for the request.',
        'We will review the request and communicate our decision or ask for additional information where necessary.',
      ],
    },
    {
      heading: 'Policy Updates',
      content: [
        'MAHDEV may update this policy when its services, booking arrangements or legal obligations change.',
        'The version applicable to an existing transaction will be determined in accordance with the agreed terms and applicable law.',
      ],
    },
  ]
);

// ---------------------------------------------------------------------------
// Shipping and Delivery Policy
// ---------------------------------------------------------------------------
export const DEFAULT_SHIPPING_CONTENT: LegalDocument = buildDocument(
  {
    id: 'shippingPolicy',
    slug: 'shipping-policy',
    title: 'Shipping and Delivery Policy',
    subtitle: 'Delivery and collection arrangements for products sold through MAHDEV Online Mart.',
  },
  'ship',
  [
    {
      heading: 'Overview',
      content: [
        'This policy applies to physical products sold through MAHDEV Online Mart.',
        'Delivery and collection options will be communicated when an order is placed or confirmed.',
      ],
    },
    {
      heading: 'Delivery Methods',
      content: [
        'Depending on the product and location, available options may include:',
        '• Courier delivery.',
        '• Delivery arranged by MAHDEV.',
        '• Customer collection from an agreed location.',
        'Not every option will be available for every order.',
      ],
    },
    {
      heading: 'Delivery Charges',
      content: [
        'Delivery charges depend on the delivery method, destination, product and order details.',
        'Any applicable delivery charge should be communicated before the order is confirmed.',
      ],
    },
    {
      heading: 'Delivery Estimates',
      content: [
        'Delivery dates or timeframes are estimates unless expressly confirmed as guaranteed in writing.',
        'Delivery may be affected by courier availability, weather, transport disruptions, stock availability and other circumstances.',
        'If a material delay becomes apparent, MAHDEV will communicate with the customer where reasonably practicable.',
      ],
    },
    {
      heading: 'Customer Responsibilities',
      content: [
        'Customers must provide accurate delivery information and a working contact number.',
        'Customers should ensure that someone is available to receive the order at the agreed delivery address.',
        "If delivery fails because of incorrect information or the customer's unavailability, additional delivery arrangements or charges may apply where disclosed and legally permissible.",
      ],
    },
    {
      heading: 'Inspection on Receipt',
      content: [
        'Customers should check the product and packaging upon receipt.',
        'Any visible damage, incorrect item or missing product should be reported promptly.',
        'Customers should retain relevant photographs, packaging and order details where needed to investigate the problem.',
      ],
    },
    {
      heading: 'Lost or Delayed Deliveries',
      content: [
        'If an order is significantly delayed or appears to be lost, contact MAHDEV with the order reference.',
        'We will investigate and coordinate with the delivery provider where appropriate.',
        'Refunds or replacement arrangements will be determined under the Refund and Cancellation Policy and applicable law.',
      ],
    },
    {
      heading: 'Collection',
      content: [
        'Where collection is available, the collection location and any applicable arrangements will be confirmed before the order is ready for collection.',
        'Customers may be asked to provide the order reference or reasonable proof of identity.',
      ],
    },
    {
      heading: 'Contact',
      content: ['Email: info.mahdev.lk@gmail.com\nTelephone: 075 092 8078 / 076 898 8970'],
    },
  ]
);

// ---------------------------------------------------------------------------
// Cookie Policy
// ---------------------------------------------------------------------------
export const DEFAULT_COOKIE_CONTENT: LegalDocument = buildDocument(
  {
    id: 'cookiePolicy',
    slug: 'cookie-policy',
    title: 'Cookie Policy',
    subtitle: 'How MAHDEV Pvt Ltd may use cookies and similar technologies on its website.',
  },
  'cookie',
  [
    {
      heading: 'Introduction',
      content: [
        'This Cookie Policy explains how MAHDEV Pvt Ltd may use cookies and similar technologies on its website.',
        "The technologies actually used depend on the website's configuration.",
      ],
    },
    {
      heading: 'What Are Cookies?',
      content: [
        'Cookies are small data files stored on a device by a website.',
        'Similar technologies may store or access information to maintain sessions, remember preferences, support security or measure website usage.',
      ],
    },
    {
      heading: 'Types of Cookies',
      content: [
        '### Essential cookies',
        'These may be required for basic website functionality, security, navigation, authentication or other essential operations.',
        '### Preference cookies',
        'These may remember settings such as the selected website language or other preferences.',
        '### Analytics cookies',
        'If analytics tools are enabled, these may help us understand how visitors use the website and identify areas for improvement.',
        '### Third-party cookies',
        'Certain integrations, such as mapping, embedded content or external services, may use their own technologies.',
        'Their use depends on the integration and its configuration.',
      ],
    },
    {
      heading: 'Google Analytics and Google Maps',
      content: [
        'Where Google Analytics is enabled, it may collect website usage information in accordance with its configuration and applicable privacy settings.',
        'Where Google Maps is integrated, Google may process technical information when visitors interact with the map or related content.',
        "Visitors should review Google's applicable privacy information for details about its processing.",
      ],
    },
    {
      heading: 'Cookie Choices',
      content: [
        'Where required by applicable law, non-essential cookies will be subject to an appropriate consent mechanism.',
        "Visitors should be able to make relevant choices through the website's cookie controls where those controls are required.",
        'Browser settings may also allow visitors to block or delete certain cookies. However, disabling essential cookies may affect website functionality.',
      ],
    },
    {
      heading: 'Changes to This Policy',
      content: [
        'We may update this Cookie Policy when our website technologies or legal obligations change.',
        'The latest version will be published on the website.',
      ],
    },
    {
      heading: 'Contact',
      content: ['MAHDEV Pvt Ltd\nEmail: info.mahdev.lk@gmail.com'],
    },
  ]
);

export type LegalDocumentId =
  | 'termsAndConditions'
  | 'privacyPolicy'
  | 'refundPolicy'
  | 'shippingPolicy'
  | 'cookiePolicy';

export const DEFAULT_LEGAL_DOCUMENTS: Record<LegalDocumentId, LegalDocument> = {
  termsAndConditions: DEFAULT_TERMS_CONTENT,
  privacyPolicy: DEFAULT_PRIVACY_CONTENT,
  refundPolicy: DEFAULT_REFUND_CONTENT,
  shippingPolicy: DEFAULT_SHIPPING_CONTENT,
  cookiePolicy: DEFAULT_COOKIE_CONTENT,
};

// Falls back to the Terms document for unknown ids, matching earlier behaviour.
export function getDefaultLegalDocument(docId: string): LegalDocument {
  return DEFAULT_LEGAL_DOCUMENTS[docId as LegalDocumentId] || DEFAULT_TERMS_CONTENT;
}
