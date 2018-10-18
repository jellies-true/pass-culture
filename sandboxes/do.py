""" sandbox """
#https://docs.python.org/3/library/datetime.html#strftime-strptime-behavior
# -*- coding: utf-8 -*-

from datetime import datetime, timedelta
import json
from pprint import pprint
import sys

from models.pc_object import PcObject
from models import Booking,\
                   Deposit,\
                   EventOccurrence,\
                   Event,\
                   Offer,\
                   Offerer,\
                   Stock,\
                   Thing,\
                   User,\
                   UserOfferer,\
                   Venue
from sandboxes.save import save
from sandboxes.scripts import sandbox_webapp, sandbox_light

def do(name):
    function_name = "sandboxes.scripts.sandbox_" + name
    sandbox_module = sys.modules[function_name]

    offerers_by_name = {}
    for offerer_mock in sandbox_module.offerer_mocks:
        query = Offerer.query.filter_by(name=offerer_mock['name'])
        if query.count() == 0:
            offerer = Offerer(from_dict=offerer_mock)
            PcObject.check_and_save(offerer)
            print("CREATED offerer")
            pprint(vars(offerer))
        else:
            offerer = query.first()
        offerers_by_name[offerer_mock['name']] = offerer

    users_by_email = {}
    for (user_index, user_mock) in enumerate(sandbox_module.user_mocks):
        query = User.query.filter_by(email=user_mock['email'])
        if query.count() == 0:
            user = User(from_dict=user_mock)
            user.validationToken = None
            PcObject.check_and_save(user)
            pprint(vars(user))
            print("CREATED user")
            if 'isAdmin' in user_mock and user_mock['isAdmin']:
                # un acteur culturel qui peut jouer à rajouter des offres partout
                # TODO: a terme, le flag isAdmin lui donne tous les droits sans
                # besoin de faire cette boucle
                for offerer in Offerer.query.all():
                    userOfferer = UserOfferer()
                    userOfferer.rights = "admin"
                    userOfferer.user = user
                    userOfferer.offerer = offerer
                    PcObject.check_and_save(userOfferer)
            save("thumbs", user, user_index)
        else:
            user = query.first()
        users_by_email[user_mock['email']] = user

    for user_offerer_mock in sandbox_module.user_offerer_mocks:
        user = users_by_email[user_offerer_mock['userEmail']]
        offerer = offerers_by_name[user_offerer_mock['offererName']]

        query = UserOfferer.query.filter_by(
            userId=user.id,
            offererId=offerer.id
        )
        if query.count() == 0:
            user_offerer = UserOfferer(from_dict=user_offerer_mock)
            user_offerer.user = user
            user_offerer.offerer = offerer
            PcObject.check_and_save(user_offerer)
            print("CREATED user_offerer")
            pprint(vars(user_offerer))

    venues_by_name = {}
    for venue_mock in sandbox_module.venue_mocks:
        offerer = offerers_by_name[venue_mock['offererName']]
        query = Venue.query.filter_by(
            managingOffererId=offerer.id,
            name=venue_mock['name']
        )
        if query.count() == 0:
            venue = Venue(from_dict=venue_mock)
            venue.managingOfferer = offerers_by_name[venue_mock['offererName']]
            PcObject.check_and_save(venue)
            print("CREATED venue")
            pprint(vars(venue))
        else:
            venue = query.first()
        venues_by_name[venue_mock['name']] = venue

    events_by_name = {}
    for event_mock in sandbox_module.event_mocks:
        query = Event.query.filter_by(name=event_mock['name'])
        if query.count() == 0:
            event = Event(from_dict=event_mock)
            PcObject.check_and_save(event)
            print("CREATED event")
            pprint(vars(event))
        else:
            event = query.first()
        events_by_name[event_mock['name']] = event

    things_by_name = {}
    for thing_mock in sandbox_module.thing_mocks:
        query = Thing.query.filter_by(name=thing_mock['name'])
        if query.count() == 0:
            thing = Thing(from_dict=thing_mock)
            PcObject.check_and_save(thing)
            print("CREATED thing")
            pprint(vars(thing))
        else:
            thing = query.first()
        things_by_name[thing_mock['name']] = thing

    offers = []
    for offer_mock in sandbox_module.offer_mocks:
        if 'eventName' in offer_mock:
            event_or_thing = events_by_name[offer_mock['eventName']]
            is_event = True
            query = Offer.query.filter_by(eventId=event_or_thing.id)
        else:
            event_or_thing = things_by_name[offer_mock['thingName']]
            is_event = False
            query = Offer.query.filter_by(thingId=event_or_thing.id)

        venue = venues_by_name[offer_mock['venueName']]
        query.filter_by(venueId=venue.id)

        if query.count() == 0:
            offer = Offer(from_dict=offer_mock)
            if is_event:
                offer.event = event_or_thing
            else:
                offer.thing = event_or_thing
            offer.venue = venue
            PcObject.check_and_save(offer)
            print("CREATED offer")
            pprint(vars(offer))
        else:
            offer = query.first()
        offers.append(offer)


    event_occurrences = []
    for event_occurrence_mock in sandbox_module.event_occurrence_mocks:
        offer = offers[event_occurrence_mock['offerIndex']]
        query = EventOccurrence.query.filter_by(
            beginningDatetime=event_occurrence_mock['beginningDatetime'],
            offerId=offer.id
        )
        if query.count() == 0:
            event_occurrence = EventOccurrence(from_dict=event_occurrence_mock)
            event_occurrence.offer = offer
            if event_occurrence.endDatetime is None:
                event_occurrence.endDatetime = event_occurrence.beginningDatetime + timedelta(hours=1)
            PcObject.check_and_save(event_occurrence)
            print("CREATED event_occurrence")
            pprint(vars(event_occurrence))
        else:
            event_occurrence = query.first()
        event_occurrences.append(event_occurrence)

    stocks = []
    for stock_mock in sandbox_module.stock_mocks:

        if 'eventOccurrenceIndex' in stock_mock:
            event_occurrence = event_occurrences[stock_mock['eventOccurrenceIndex']]
            query = Stock.queryNotSoftDeleted().filter_by(eventOccurrenceId=event_occurrence.id)
        else:
            offer = offers[stock_mock['offerIndex']]
            query = Stock.queryNotSoftDeleted().filter_by(offerId=offer.id)

        if query.count() == 0:
            stock = Stock(from_dict=stock_mock)
            if 'eventOccurrenceIndex' in stock_mock:
                stock.eventOccurrence = event_occurrence
            else:
                stock.offer = offer
            PcObject.check_and_save(stock)
            print("CREATED stock")
            pprint(vars(stock))
        else:
            stock = query.first()
        stocks.append(stock)

    deposits = []
    for deposit_mock in sandbox_module.deposit_mocks:
        user = User.query.filter_by(email=deposit_mock['userEmail']).one()
        query = Deposit.query.filter_by(userId=user.id)
        if query.count() == 0:
            deposit = Deposit(from_dict=deposit_mock)
            deposit.user = user
            PcObject.check_and_save(deposit)
            print("CREATED deposit")
            pprint(vars(deposit))
        else:
            deposit = query.first()
        deposits.append(deposit)

    bookings = []
    for booking_mock in sandbox_module.booking_mocks:
        stock = stocks[booking_mock['stockIndex']]
        user = User.query.filter_by(email=booking_mock['userEmail']).one()
        query = Booking.query.filter_by(stockId=stock.id, userId=user.id, token=booking_mock['token'])
        if query.count() == 0:
            booking = Booking(from_dict=booking_mock)
            booking.stock = stock
            booking.user = user
            booking.amount = stock.price
            PcObject.check_and_save(booking)
            print("CREATED booking")
            pprint(vars(booking))
        else:
            booking = query.first()
        bookings.append(booking)
