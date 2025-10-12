import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Img,
  Heading,
  Text,
  Button,
  Hr,
  Link,
  Tailwind,
  Preview,
} from '@react-email/components';

const RegistrationConfirmationEmail = (props) => {
  const { 
    customerName, 
    className,
    classDate, 
    classTime, 
    location,
    registeredParticipants, 
    totalAmount,
    classPrepUrl,
    googleCalendarUrl
  } = props;

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>Your self defense class registration is confirmed - you're taking an important step toward empowerment!</Preview>
        <Body className="font-sans py-[40px]" style={{ backgroundColor: '#F6F8FA' }}>
          <Container className="mx-auto px-[20px] py-[40px] max-w-[600px]" style={{ backgroundColor: '#FFFFFF' }}>
            
            {/* Header with Logo */}
            <Section className="text-center mb-[32px]">
              <Img
                src="https://www.streetwiseselfdefense.com/swsd-logo-official.png"
                alt="Streetwise Self Defense"
                className="w-full h-auto object-cover max-w-[300px] mx-auto"
              />
            </Section>

            {/* Main Content */}
            <Section className="mb-[32px]">
              <Heading className="text-[28px] font-bold mb-[24px] text-center" style={{ color: '#1E293B' }}>
                Registration Confirmed!
              </Heading>
              
              <Text className="text-[16px] leading-[24px] mb-[20px]" style={{ color: '#1E293B' }}>
                Dear {customerName},
              </Text>
              
              <Text className="text-[16px] leading-[24px] mb-[20px]" style={{ color: '#1E293B' }}>
                Congratulations on taking this empowering step! Your registration for our self defense class has been confirmed, and we're excited to support you on your journey from fear to confidence.
              </Text>
              
              <Text className="text-[16px] leading-[24px] mb-[24px]" style={{ color: '#1E293B' }}>
                You're not just learning techniques – you're building strength, awareness, and the confidence that comes with knowing you can protect yourself.
              </Text>
            </Section>

            {/* Class Details Box */}
            <Section className="mb-[32px] p-[24px] rounded-[8px]" style={{ backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0' }}>
              <Heading className="text-[20px] font-semibold mb-[16px]" style={{ color: '#1E293B' }}>
                Your Class Details
              </Heading>
              
              <Row className="mb-[12px]">
                <Column>
                  <Text className="text-[14px] font-semibold mb-[4px] m-0" style={{ color: '#64748B' }}>CLASS</Text>
                  <Text className="text-[16px] m-0" style={{ color: '#1E293B' }}>{className}</Text>
                </Column>
              </Row>
              
              <Row className="mb-[12px]">
                <Column>
                  <Text className="text-[14px] font-semibold mb-[4px] m-0" style={{ color: '#64748B' }}>DATE</Text>
                  <Text className="text-[16px] m-0" style={{ color: '#1E293B' }}>{classDate}</Text>
                </Column>
              </Row>
              
              <Row className="mb-[12px]">
                <Column>
                  <Text className="text-[14px] font-semibold mb-[4px] m-0" style={{ color: '#64748B' }}>TIME</Text>
                  <Text className="text-[16px] m-0" style={{ color: '#1E293B' }}>{classTime}</Text>
                </Column>
              </Row>
              
              <Row className="mb-[12px]">
                <Column>
                  <Text className="text-[14px] font-semibold mb-[4px] m-0" style={{ color: '#64748B' }}>LOCATION</Text>
                  <Text className="text-[16px] m-0" style={{ color: '#1E293B' }}>{location}</Text>
                </Column>
              </Row>
              
              <Row className="mb-[12px]">
                <Column>
                  <Text className="text-[14px] font-semibold mb-[4px] m-0" style={{ color: '#64748B' }}>PARTICIPANTS</Text>
                  <Text className="text-[16px] m-0" style={{ color: '#1E293B' }}>{registeredParticipants}</Text>
                </Column>
              </Row>
              
              <Row>
                <Column>
                  <Text className="text-[14px] font-semibold mb-[4px] m-0" style={{ color: '#64748B' }}>TOTAL PAID</Text>
                  <Text className="text-[16px] m-0" style={{ color: '#1E293B' }}>${totalAmount}</Text>
                </Column>
              </Row>
            </Section>

            {/* Action Buttons */}
            <Section className="mb-[32px]">
              {/* Class Prep Page - Primary CTA */}
              {classPrepUrl && (
                <Row className="mb-[16px]">
                  <Column>
                    <Button
                      href={classPrepUrl}
                      className="box-border px-[24px] py-[12px] rounded-[6px] text-[16px] font-semibold border-solid border-[2px] no-underline text-center w-full"
                      style={{ borderColor: '#14b8a6', color: '#ffffff', backgroundColor: '#14b8a6' }}
                    >
                      View Class Prep & Complete Waiver
                    </Button>
                  </Column>
                </Row>
              )}
              
              <Text className="text-[14px] leading-[20px] mb-[16px] text-center" style={{ color: '#6B7280' }}>
                <strong>Important:</strong> Please visit the prep page above for important details about what to wear, what to bring, and to complete your required waiver form.
              </Text>
              
              {/* Add to Calendar */}
              {googleCalendarUrl && (
                <Row>
                  <Column>
                    <Button
                      href={googleCalendarUrl}
                      className="box-border px-[24px] py-[12px] rounded-[6px] text-[16px] font-semibold border-solid border-[2px] no-underline text-center w-full"
                      style={{ borderColor: '#14b8a6', color: '#14b8a6', backgroundColor: 'transparent' }}
                    >
                      Add to Calendar
                    </Button>
                  </Column>
                </Row>
              )}
            </Section>

            {/* What to Expect */}
            <Section className="mb-[32px]">
              <Heading className="text-[20px] font-semibold mb-[16px]" style={{ color: '#1E293B' }}>
                What to Expect
              </Heading>
              
              <Text className="text-[16px] leading-[24px] mb-[12px]" style={{ color: '#1E293B' }}>
                Our classes are designed to be empowering, supportive, and safe. You'll learn practical techniques that work for real-world situations, not just the dojo. Here's what you can look forward to:
              </Text>
              
              <ul className="text-[16px] leading-[24px] mb-[20px]" style={{ color: '#1E293B', paddingLeft: '20px' }}>
                <li className="mb-[8px]">Evidence-based self defense strategies backed by research</li>
                <li className="mb-[8px]">Hands-on practice with supportive instructors</li>
                <li className="mb-[8px]">A safe, judgement-free environment</li>
                <li className="mb-[8px]">Techniques that work regardless of size or strength</li>
                <li className="mb-[8px]">Confidence-building exercises and scenario training</li>
              </ul>
            </Section>

            {/* Questions/Support */}
            <Section className="mb-[32px]">
              <Heading className="text-[20px] font-semibold mb-[16px]" style={{ color: '#1E293B' }}>
                Questions or Need Help?
              </Heading>
              
              <Text className="text-[16px] leading-[24px] mb-[20px]" style={{ color: '#1E293B' }}>
                We're here to support you every step of the way. Visit our website at{' '}
                <Link href="https://www.streetwiseselfdefense.com" style={{ color: '#14b8a6' }}>
                  streetwiseselfdefense.com
                </Link>{' '}
                or reply to this email.
              </Text>
              
              <Text className="text-[16px] leading-[24px] mb-[20px]" style={{ color: '#1E293B' }}>
                We're proud of you for taking this important step toward empowerment. See you in class!
              </Text>
              
              <Text className="text-[16px] leading-[24px] font-semibold" style={{ color: '#1E293B' }}>
                The Streetwise Self Defense Team
              </Text>
            </Section>

            <Hr className="border-solid border-[1px] my-[32px]" style={{ borderColor: '#E5E7EB' }} />

            {/* Footer */}
            <Section className="text-center">
              <Text className="text-[14px] leading-[20px] mb-[16px]" style={{ color: '#6B7280' }}>
                Empowering women and vulnerable populations through practical self defense training. Building confidence, strength, and safety awareness since 2014.
              </Text>
              
              <Text className="text-[14px] leading-[20px] mb-[8px] m-0" style={{ color: '#6B7280' }}>
                Streetwise Self Defense
              </Text>
              <Text className="text-[14px] leading-[20px] mb-[16px] m-0" style={{ color: '#6B7280' }}>
                Walnut Creek, CA
              </Text>
              
              <Text className="text-[12px] leading-[16px] m-0" style={{ color: '#6B7280' }}>
                © 2025 Streetwise Self Defense. All rights reserved.
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

// Preview props for testing in React Email
RegistrationConfirmationEmail.PreviewProps = {
  customerName: "Sarah Johnson",
  className: "Women's Self Defense - Adult & Teen",
  classDate: "Saturday, March 15th, 2025",
  classTime: "10:00 AM - 12:00 PM",
  location: "Forma Gym, Walnut Creek, CA",
  registeredParticipants: "2",
  totalAmount: "150",
  classPrepUrl: "https://www.streetwiseselfdefense.com/class-prep/rec123abc",
  googleCalendarUrl: "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Self+Defense+Class"
};

export default RegistrationConfirmationEmail;